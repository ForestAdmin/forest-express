const superagent = require('superagent');

const path = require('../services/path');
const auth = require('../services/auth');

// Never forwarded (request or response): hop-by-hop, Host, and body-framing headers.
// res.json() re-serializes the body, so upstream length/encoding no longer match — and
// forwarding accept-encoding would relay an encoding the re-emitted body doesn't use.
const SKIPPED_HEADERS = new Set([
  'connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'te', 'trailer',
  'proxy-authenticate', 'proxy-authorization', 'host',
  'content-length', 'content-encoding', 'accept-encoding',
]);
const UNSAFE_PATH_FRAGMENTS = ['..', '%2e', '%2E', '\\', '\0'];

// NOTICE: Bound the proxied request so a hanging executor cannot tie up the
//         connection indefinitely. A timeout raises an error without `.response`,
//         so it falls through to the 503 branch.
const REQUEST_TIMEOUT = { response: 120000, deadline: 120000 };

function forwardedRequestHeaders(requestHeaders) {
  const headers = {};
  Object.entries(requestHeaders).forEach(([name, value]) => {
    if (value !== undefined && !SKIPPED_HEADERS.has(name.toLowerCase())) {
      headers[name] = value;
    }
  });
  return headers;
}

function copyResponseHeaders(upstream, response) {
  Object.entries(upstream.headers || {}).forEach(([name, value]) => {
    if (value !== undefined && !SKIPPED_HEADERS.has(name.toLowerCase())) {
      response.set(name, value);
    }
  });
}

// First-pass rejection of escape attempts; returns null for anything that could leave the
// executor origin (the authoritative origin check is in buildHandler).
function executorPath(wildcard) {
  if (!wildcard
    || wildcard.startsWith('/')
    || UNSAFE_PATH_FRAGMENTS.some((fragment) => wildcard.includes(fragment))) {
    return null;
  }
  return `/${wildcard}`;
}

function buildHandler({ baseUrl, logger }) {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const baseOrigin = new URL(normalizedBase).origin;

  return async (request, response) => {
    const suffix = executorPath(request.params[0]);
    if (suffix === null) return response.status(404).json({ error: 'not_found' });

    const url = `${normalizedBase}${suffix}`;
    // Authoritative SSRF check: the forwarded request must never leave the executor origin.
    if (new URL(url).origin !== baseOrigin) {
      return response.status(404).json({ error: 'not_found' });
    }
    const method = request.method.toLowerCase();

    try {
      let outgoing = superagent[method](url)
        // Don't follow redirects: a 3xx to an off-origin Location would bypass the origin guard
        // (and matches the Node agent, whose raw http client never follows redirects).
        .redirects(0)
        .timeout(REQUEST_TIMEOUT)
        .set(forwardedRequestHeaders(request.headers));
      if (request.query) outgoing = outgoing.query(request.query);
      if (method !== 'get' && request.body !== undefined) {
        outgoing = outgoing.send(request.body);
      }
      const upstream = await outgoing;
      copyResponseHeaders(upstream, response);
      return response.status(upstream.status).json(upstream.body);
    } catch (error) {
      if (error.response) {
        copyResponseHeaders(error.response, response);
        return response.status(error.response.status).json(error.response.body);
      }
      logger.error('[forest-express] workflow executor proxy error: ', error.message);
      return response.status(503).json({ error: 'workflow_executor_unreachable' });
    }
  };
}

// Catch-all: forward any verb/sub-path verbatim to the executor, so a new executor route needs
// no change here.
function initWorkflowExecutorRoutes(app, opts, { logger }) {
  if (!opts.workflowExecutorUrl) return;

  app.all(
    path.generate('_internal/executor/*', opts),
    auth.ensureAuthenticated,
    buildHandler({ baseUrl: opts.workflowExecutorUrl, logger }),
  );
}

module.exports = initWorkflowExecutorRoutes;
