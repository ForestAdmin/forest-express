const nock = require('nock');
const request = require('supertest');
const zlib = require('zlib');

const createServer = require('../helpers/create-server');
const auth = require('../../src/services/auth');
const initWorkflowExecutorRoutes = require('../../src/routes/workflow-executor');

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');
const executorBase = 'http://workflow-executor.test:4001';

function mockEnsureAuthenticated() {
  jest.spyOn(auth, 'ensureAuthenticated').mockImplementation((req, res, next) => next());
}

describe('routes > workflow executor proxy', () => {
  // NOTICE: Run teardown unconditionally so a failed assertion cannot leak a nock
  //         interceptor or a mock into the next test.
  // eslint-disable-next-line jest/no-hooks
  afterEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
  });

  describe('generic forwarding', () => {
    it('forwards a run GET (caller includes runs/) with query params, returning the response', async () => {
      mockEnsureAuthenticated();
      const app = await createServer(envSecret, authSecret, { workflowExecutorUrl: executorBase });
      const scope = nock(executorBase)
        .get('/runs/run-123')
        .query({ foo: 'bar' })
        .reply(200, { id: 'run-123', state: 'pending' });

      const response = await request(app)
        .get('/forest/_internal/executor/runs/run-123?foo=bar');

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({ id: 'run-123', state: 'pending' });
      expect(scope.isDone()).toBe(true);
    });

    it('forwards a POST trigger with the JSON body to /runs/:runId/trigger', async () => {
      mockEnsureAuthenticated();
      const app = await createServer(envSecret, authSecret, { workflowExecutorUrl: executorBase });
      const scope = nock(executorBase)
        .post('/runs/run-42/trigger', { step: 'approve', value: 42 })
        .reply(200, { ok: true });

      const response = await request(app)
        .post('/forest/_internal/executor/runs/run-42/trigger')
        .send({ step: 'approve', value: 42 });

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({ ok: true });
      expect(scope.isDone()).toBe(true);
    });

    it('forwards a non-runs route verbatim (no /runs prefix injected)', async () => {
      mockEnsureAuthenticated();
      const app = await createServer(envSecret, authSecret, { workflowExecutorUrl: executorBase });
      const scope = nock(executorBase)
        .delete('/mcp-oauth-credentials')
        .reply(200, { deleted: true });

      const response = await request(app)
        .delete('/forest/_internal/executor/mcp-oauth-credentials');

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({ deleted: true });
      expect(scope.isDone()).toBe(true);
    });

    it('forwards a 4xx executor response verbatim', async () => {
      mockEnsureAuthenticated();
      const app = await createServer(envSecret, authSecret, { workflowExecutorUrl: executorBase });
      nock(executorBase).get('/runs/run-456').reply(422, { error: 'invalid_step' });

      const response = await request(app)
        .get('/forest/_internal/executor/runs/run-456');

      expect(response.status).toBe(422);
      expect(response.body).toStrictEqual({ error: 'invalid_step' });
    });

    it('returns 503 when the executor is unreachable', async () => {
      mockEnsureAuthenticated();
      const app = await createServer(envSecret, authSecret, { workflowExecutorUrl: executorBase });
      nock(executorBase)
        .get('/runs/run-789')
        .replyWithError({ code: 'ECONNREFUSED', message: 'refused' });

      const response = await request(app)
        .get('/forest/_internal/executor/runs/run-789');

      expect(response.status).toBe(503);
      expect(response.body).toStrictEqual({ error: 'workflow_executor_unreachable' });
    });
  });

  describe('header forwarding', () => {
    // The test helper's express-jwt layer can't accept tokens signed with the
    // agent's authSecret, so we exercise the handler directly: capture it via
    // a fake express app and invoke it with a mock req/res.
    function captureHandler() {
      let handler;
      const fakeApp = { all: jest.fn((_path, _auth, fn) => { handler = fn; }) };
      initWorkflowExecutorRoutes(
        fakeApp,
        { workflowExecutorUrl: executorBase },
        { logger: { error: jest.fn() } },
      );
      return handler;
    }

    function fakeRes() {
      const res = { status: jest.fn(), json: jest.fn(), set: jest.fn() };
      res.status.mockReturnValue(res);
      res.json.mockReturnValue(res);
      res.set.mockReturnValue(res);
      return res;
    }

    it('forwards all client headers except hop-by-hop / host / content-length', async () => {
      const handler = captureHandler();
      const scope = nock(executorBase, {
        reqheaders: {
          authorization: 'Bearer abc',
          cookie: 'forest_session_token=xyz',
          'x-custom': 'forwarded',
        },
        badheaders: ['te', 'host'],
      })
        .get('/runs/run-1')
        .reply(200, { ok: true });

      const req = {
        method: 'GET',
        params: { 0: 'runs/run-1' },
        query: {},
        headers: {
          authorization: 'Bearer abc',
          cookie: 'forest_session_token=xyz',
          'x-custom': 'forwarded',
          te: 'trailers',
          host: 'agent.test',
        },
      };
      const res = fakeRes();

      await handler(req, res);

      expect(scope.isDone()).toBe(true);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('forwards executor response headers except hop-by-hop / encoding ones', async () => {
      const handler = captureHandler();
      // gzipped body + content-type so superagent actually decompresses it. The proxy then
      // re-emits plain JSON via res.json(), so it must NOT relay the upstream content-encoding.
      const gzipped = zlib.gzipSync(JSON.stringify({ ok: true }));
      nock(executorBase)
        .get('/runs/run-1')
        .reply(200, gzipped, {
          'content-type': 'application/json',
          'content-encoding': 'gzip',
          'x-executor-custom': 'passthrough-value',
        });

      const req = {
        method: 'GET', params: { 0: 'runs/run-1' }, query: {}, headers: {},
      };
      const res = fakeRes();

      await handler(req, res);

      // Body was decoded and re-emitted as plain JSON...
      expect(res.json).toHaveBeenCalledWith({ ok: true });
      expect(res.set).toHaveBeenCalledWith('x-executor-custom', 'passthrough-value');
      // ...so the upstream content-encoding must not be relayed onto plain bytes.
      expect(res.set).not.toHaveBeenCalledWith('content-encoding', expect.anything());
    });

    it('does not forward the client accept-encoding (superagent manages its own)', async () => {
      const handler = captureHandler();
      // A forwarded client value would override superagent's own header; assert it doesn't.
      const scope = nock(executorBase)
        .matchHeader('accept-encoding', (value) => value !== 'identity')
        .get('/runs/run-1')
        .reply(200, { ok: true });

      const req = {
        method: 'GET', params: { 0: 'runs/run-1' }, query: {}, headers: { 'accept-encoding': 'identity' },
      };
      const res = fakeRes();

      await handler(req, res);

      expect(scope.isDone()).toBe(true);
    });
  });

  describe('guards against escaping the executor origin (SSRF)', () => {
    function captureHandler() {
      let handler;
      const fakeApp = { all: jest.fn((_path, _auth, fn) => { handler = fn; }) };
      initWorkflowExecutorRoutes(
        fakeApp,
        { workflowExecutorUrl: executorBase },
        { logger: { error: jest.fn() } },
      );
      return handler;
    }

    it.each([
      '..',
      '../mcp-oauth-credentials',
      'run-123/../../mcp-oauth-credentials',
      '%2e%2e/mcp-oauth-credentials',
    ])('rejects %p with 404 and never forwards', async (evilPath) => {
      const handler = captureHandler();
      const scope = nock(executorBase).get(/.*/).reply(200, {});

      const req = {
        method: 'GET', params: { 0: evilPath }, query: {}, headers: {},
      };
      const res = { status: jest.fn(), json: jest.fn() };
      res.status.mockReturnValue(res);
      res.json.mockReturnValue(res);

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(scope.isDone()).toBe(false);
      nock.cleanAll();
    });

    it('does not follow an executor redirect to an off-origin host', async () => {
      const handler = captureHandler();
      // Executor replies 3xx pointing off-origin; the proxy must NOT chase it.
      nock(executorBase)
        .get('/runs/run-1')
        .reply(302, '', { Location: 'http://evil.com/stolen' });
      const evil = nock('http://evil.com').get('/stolen').reply(200, { hacked: true });

      const req = {
        method: 'GET', params: { 0: 'runs/run-1' }, query: {}, headers: {},
      };
      const res = { status: jest.fn(), json: jest.fn(), set: jest.fn() };
      res.status.mockReturnValue(res);
      res.json.mockReturnValue(res);
      res.set.mockReturnValue(res);

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(302); // 3xx returned to the client, not followed
      expect(evil.isDone()).toBe(false); // never reached the off-origin host
      nock.cleanAll();
    });
  });

  describe('lazy mount', () => {
    const fakeLogger = { error: jest.fn() };

    it('does not register any route when workflowExecutorUrl is not set', () => {
      const fakeApp = { all: jest.fn() };
      initWorkflowExecutorRoutes(fakeApp, {}, { logger: fakeLogger });
      expect(fakeApp.all).not.toHaveBeenCalled();
    });

    it('registers a single catch-all route when workflowExecutorUrl is set', () => {
      const fakeApp = { all: jest.fn() };
      initWorkflowExecutorRoutes(
        fakeApp,
        { workflowExecutorUrl: executorBase },
        { logger: fakeLogger },
      );
      expect(fakeApp.all).toHaveBeenCalledTimes(1);
      expect(fakeApp.all.mock.calls[0][0]).toBe('/forest/_internal/executor/*');
    });
  });
});
