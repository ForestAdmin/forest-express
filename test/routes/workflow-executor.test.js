const nock = require('nock');
const request = require('supertest');

const createServer = require('../helpers/create-server');
const auth = require('../../src/services/auth');
const initWorkflowExecutorRoutes = require('../../src/routes/workflow-executor');

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');
const executorBase = 'http://workflow-executor.test:4001';

function mockEnsureAuthenticated() {
  jest.spyOn(auth, 'ensureAuthenticated').mockImplementation((req, res, next) => next());
}

function teardown() {
  jest.clearAllMocks();
  nock.cleanAll();
}

describe('routes > workflow executor proxy', () => {
  describe('get /forest/_internal/workflow-executions/:runId', () => {
    it('forwards GET to executor /runs/:runId with query params', async () => {
      mockEnsureAuthenticated();
      const app = await createServer(envSecret, authSecret, { workflowExecutorUrl: executorBase });
      const scope = nock(executorBase)
        .get('/runs/run-123')
        .query({ foo: 'bar' })
        .reply(200, { id: 'run-123', state: 'pending' });

      const response = await request(app)
        .get('/forest/_internal/workflow-executions/run-123?foo=bar');

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({ id: 'run-123', state: 'pending' });
      expect(scope.isDone()).toBe(true);
      teardown();
    });

    it('forwards a 4xx executor response verbatim', async () => {
      mockEnsureAuthenticated();
      const app = await createServer(envSecret, authSecret, { workflowExecutorUrl: executorBase });
      nock(executorBase).get('/runs/run-456').reply(422, { error: 'invalid_step' });

      const response = await request(app)
        .get('/forest/_internal/workflow-executions/run-456');

      expect(response.status).toBe(422);
      expect(response.body).toStrictEqual({ error: 'invalid_step' });
      teardown();
    });

    it('returns 503 when the executor is unreachable', async () => {
      mockEnsureAuthenticated();
      const app = await createServer(envSecret, authSecret, { workflowExecutorUrl: executorBase });
      nock(executorBase)
        .get('/runs/run-789')
        .replyWithError({ code: 'ECONNREFUSED', message: 'refused' });

      const response = await request(app)
        .get('/forest/_internal/workflow-executions/run-789');

      expect(response.status).toBe(503);
      expect(response.body).toStrictEqual({ error: 'workflow_executor_unreachable' });
      teardown();
    });
  });

  describe('post /forest/_internal/workflow-executions/:runId/trigger', () => {
    it('forwards POST with the JSON body to executor /runs/:runId/trigger', async () => {
      mockEnsureAuthenticated();
      const app = await createServer(envSecret, authSecret, { workflowExecutorUrl: executorBase });
      const scope = nock(executorBase)
        .post('/runs/run-42/trigger', { step: 'approve', value: 42 })
        .reply(200, { ok: true });

      const response = await request(app)
        .post('/forest/_internal/workflow-executions/run-42/trigger')
        .send({ step: 'approve', value: 42 });

      expect(response.status).toBe(200);
      expect(response.body).toStrictEqual({ ok: true });
      expect(scope.isDone()).toBe(true);
      teardown();
    });
  });

  describe('header forwarding', () => {
    // The test helper's express-jwt layer can't accept tokens signed with the
    // agent's authSecret, so we exercise the handler directly: capture it via
    // a fake express app and invoke it with a mock req/res.
    function captureHandlers() {
      const captured = {};
      const fakeApp = {
        get: jest.fn((_path, _auth, handler) => { captured.get = handler; }),
        post: jest.fn((_path, _auth, handler) => { captured.post = handler; }),
      };
      initWorkflowExecutorRoutes(
        fakeApp,
        { workflowExecutorUrl: executorBase },
        { logger: { error: jest.fn() } },
      );
      return captured;
    }

    function fakeRes() {
      const res = {
        status: jest.fn(),
        json: jest.fn(),
      };
      res.status.mockReturnValue(res);
      res.json.mockReturnValue(res);
      return res;
    }

    it('forwards only Authorization and Cookie headers to the executor', async () => {
      const { get } = captureHandlers();
      const scope = nock(executorBase, {
        reqheaders: {
          authorization: 'Bearer abc',
          cookie: 'forest_session_token=xyz',
        },
        badheaders: ['x-custom', 'forest-secret-key'],
      })
        .get('/runs/run-1')
        .reply(200, { ok: true });

      const req = {
        method: 'GET',
        params: { runId: 'run-1' },
        query: {},
        headers: {
          authorization: 'Bearer abc',
          cookie: 'forest_session_token=xyz',
          'x-custom': 'should-not-leak',
          'forest-secret-key': 'should-not-leak',
        },
      };
      const res = fakeRes();

      await get(req, res);

      expect(scope.isDone()).toBe(true);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ok: true });
      teardown();
    });
  });

  describe('lazy mount', () => {
    const fakeLogger = { error: jest.fn() };

    it('does not register any route when workflowExecutorUrl is not set', () => {
      const fakeApp = { get: jest.fn(), post: jest.fn() };
      initWorkflowExecutorRoutes(fakeApp, {}, { logger: fakeLogger });
      expect(fakeApp.get).not.toHaveBeenCalled();
      expect(fakeApp.post).not.toHaveBeenCalled();
    });

    it('registers exactly two routes when workflowExecutorUrl is set', () => {
      const fakeApp = { get: jest.fn(), post: jest.fn() };
      initWorkflowExecutorRoutes(
        fakeApp,
        { workflowExecutorUrl: executorBase },
        { logger: fakeLogger },
      );
      expect(fakeApp.get).toHaveBeenCalledTimes(1);
      expect(fakeApp.post).toHaveBeenCalledTimes(1);
      expect(fakeApp.get.mock.calls[0][0]).toBe('/forest/_internal/workflow-executions/:runId');
      expect(fakeApp.post.mock.calls[0][0]).toBe('/forest/_internal/workflow-executions/:runId/trigger');
    });
  });
});
