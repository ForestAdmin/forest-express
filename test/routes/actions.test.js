const ApplicationContext = require('../../src/context/application-context');
const ActionsRoutes = require('../../src/routes/actions');

function initContext() {
  const context = new ApplicationContext();
  context.init((ctx) => ctx
    .addInstance('logger', { warn: jest.fn() })
    .addInstance('pathService', {
      generate: jest.fn((path) => path),
      generateForSmartActionCustomEndpoint: jest.fn((path) => path),
    })
    .addInstance('stringUtils', {
      parameterize: jest.fn((name) => name),
    })
    .addClass(ActionsRoutes)
    .addValue('model', { name: 'users' })
    .addValue('implementation', { getModelName: jest.fn((m) => m.name) })
    .addValue('app', { post: jest.fn((...params) => params) }));
  return context;
}

describe('routes > actions', () => {
  it('should not create a route when no actions is present', async () => {
    expect.assertions(2);

    const { actions, model, implementation } = initContext().inject();

    const schemas = { users: {} };

    await actions.perform({}, model, implementation, {}, {}, schemas);

    expect(implementation.getModelName).toHaveReturnedWith('users');
    expect(implementation.getModelName).toHaveBeenCalledTimes(1);
  });

  it('should not create a route when no actions.values is present', async () => {
    expect.assertions(4);

    const {
      actions, pathService, model, implementation,
    } = initContext().inject();

    const schemas = { users: { actions: [{}, {}] } };

    await actions.perform({}, model, implementation, {}, {}, schemas);

    expect(implementation.getModelName).toHaveReturnedWith('users');
    expect(implementation.getModelName).toHaveBeenCalledTimes(1);
    expect(pathService.generate).not.toHaveBeenCalled();
    expect(pathService.generateForSmartActionCustomEndpoint).not.toHaveBeenCalled();
  });

  describe('when actions.values is present', () => {
    it('should create a route', async () => {
      expect.assertions(4);

      const {
        actions, pathService, stringUtils, model, implementation, app,
      } = initContext().inject();

      const schemas = { users: { actions: [{ values: jest.fn(() => ({ name: 'Jane' })), name: 'send invoice' }] } };

      await actions.perform(app, model, implementation, {}, {}, schemas);

      expect(stringUtils.parameterize).toHaveBeenCalledTimes(1);
      expect(pathService.generate).toHaveBeenCalledTimes(1);
      expect(app.post).toHaveBeenCalledTimes(1);

      const [path] = app.post.mock.results[0].value;
      expect(path).toBe('actions/send invoice/values');
    });

    it('should create a valid route callback', async () => {
      expect.assertions(4);

      const {
        actions, model, implementation, app,
      } = initContext().inject();

      const schemas = { users: { actions: [{ values: jest.fn(() => ({ name: 'Jane' })), name: 'send invoice' }] } };
      const request = { body: { data: { attributes: { values: { name: 'Jane' } } } } };
      const send = jest.fn((values) => values);
      const response = { status: jest.fn(() => ({ send })) };

      await actions.perform(app, model, implementation, {}, {}, schemas);

      const [, , callback] = app.post.mock.results[0].value;

      const result = await callback(request, response);

      expect(schemas.users.actions[0].values).toHaveBeenCalledTimes(1);
      expect(response.status).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual({ name: 'Jane' });
    });

    it('should handle async values function', async () => {
      expect.assertions(4);

      const {
        actions, model, implementation, app,
      } = initContext().inject();

      const schemas = {
        users: {
          actions: [
            { values: jest.fn(() => Promise.resolve(({ name: 'Jane' }))), name: 'send invoice' },
          ],
        },
      };
      const request = { body: { data: { attributes: { values: { name: 'Jane' } } } } };
      const send = jest.fn((values) => values);
      const response = { status: jest.fn(() => ({ send })) };

      await actions.perform(app, model, implementation, {}, {}, schemas);

      const [, , callback] = app.post.mock.results[0].value;

      const result = await callback(request, response);

      expect(schemas.users.actions[0].values).toHaveBeenCalledTimes(1);
      expect(response.status).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual({ name: 'Jane' });
    });
  });
});
