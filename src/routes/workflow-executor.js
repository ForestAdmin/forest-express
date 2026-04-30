const superagent = require('superagent');

const path = require('../services/path');
const auth = require('../services/auth');

const FORWARDED_REQUEST_HEADERS = ['authorization', 'cookie'];

function pickForwardedHeaders(requestHeaders) {
  const headers = {};
  FORWARDED_REQUEST_HEADERS.forEach((name) => {
    const value = requestHeaders[name];
    if (value) {
      headers[name] = value;
    }
  });
  return headers;
}

function buildHandler({ baseUrl, suffix, logger }) {
  const normalizedBase = baseUrl.replace(/\/+$/, '');

  return async (request, response) => {
    const url = `${normalizedBase}/runs/${request.params.runId}${suffix}`;
    const method = request.method.toLowerCase();

    try {
      let outgoing = superagent[method](url).set(pickForwardedHeaders(request.headers));
      if (request.query) outgoing = outgoing.query(request.query);
      if (method !== 'get' && request.body !== undefined) {
        outgoing = outgoing.send(request.body);
      }
      const upstream = await outgoing;
      return response.status(upstream.status).json(upstream.body);
    } catch (error) {
      if (error.response) {
        return response.status(error.response.status).json(error.response.body);
      }
      logger.error('[forest-express] workflow executor proxy error: ', error.message);
      return response.status(503).json({ error: 'workflow_executor_unreachable' });
    }
  };
}

function initWorkflowExecutorRoutes(app, opts, { logger }) {
  if (!opts.workflowExecutorUrl) return;

  app.get(
    path.generate('_internal/workflow-executions/:runId', opts),
    auth.ensureAuthenticated,
    buildHandler({ baseUrl: opts.workflowExecutorUrl, suffix: '', logger }),
  );

  app.post(
    path.generate('_internal/workflow-executions/:runId/trigger', opts),
    auth.ensureAuthenticated,
    buildHandler({ baseUrl: opts.workflowExecutorUrl, suffix: '/trigger', logger }),
  );
}

module.exports = initWorkflowExecutorRoutes;
