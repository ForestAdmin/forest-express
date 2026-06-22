const superagent = require('superagent');

const path = require('../services/path');
const auth = require('../services/auth');

const EXECUTOR_PREFIX = '/runs';
// Hop-by-hop / client-recomputed headers — never forwarded (request or response side).
const SKIPPED_HEADERS = new Set([
  'connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'te', 'trailer',
  'proxy-authenticate', 'proxy-authorization', 'host', 'content-length',
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

// Security boundary: the wildcard can only map into EXECUTOR_PREFIX; reject anything that could
// escape it, so non-/runs executor routes stay unreachable through the proxy.
function executorPath(wildcard) {
  if (!wildcard
    || wildcard.startsWith('/')
    || UNSAFE_PATH_FRAGMENTS.some((fragment) => wildcard.includes(fragment))) {
    return null;
  }
  return `${EXECUTOR_PREFIX}/${wildcard}`;
}

function buildHandler({ baseUrl, logger }) {
  const normalizedBase = baseUrl.replace(/\/+$/, '');

  return async (request, response) => {
    const suffix = executorPath(request.params[0]);
    if (suffix === null) return response.status(404).json({ error: 'not_found' });

    const url = `${normalizedBase}${suffix}`;
    const method = request.method.toLowerCase();

    try {
      let outgoing = superagent[method](url)
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

// Catch-all: forward any verb/sub-path to EXECUTOR_PREFIX so a new executor route needs no change
// here (PRD-567).
function initWorkflowExecutorRoutes(app, opts, { logger }) {
  if (!opts.workflowExecutorUrl) return;

  app.all(
    path.generate('_internal/workflow-executions/*', opts),
    auth.ensureAuthenticated,
    buildHandler({ baseUrl: opts.workflowExecutorUrl, logger }),
  );
}

module.exports = initWorkflowExecutorRoutes;
