const ApplicationContext = require('../../src/context/application-context');
const ActionsRoutes = require('../../src/routes/actions');

function initContext(schema, hookLoadGetResponse) {
  const context = new ApplicationContext();
  context.init((ctx) => ctx
    .addInstance('logger', { warn: jest.fn(), error: jest.fn() })
    .addInstance('pathService', {
      generate: jest.fn((path) => path),
      generateForSmartActionCustomEndpoint: jest.fn((path) => path),
    })
    .addInstance('stringUtils', {
      parameterize: jest.fn((name) => name),
    })
    .addInstance('schemasGenerator', { schemas: schema })
    .addInstance('hookLoad', { getResponse: hookLoadGetResponse })
    .addClass(ActionsRoutes)
    .addValue('model', { name: 'users' })
    .addValue('implementation', { getModelName: jest.fn((m) => m.name) })
    .addValue('app', { post: jest.fn() }));
  return context;
}

async function callLoadHook(load, hookLoadGetResponse) {
  const schemas = {
    users: {
      actions: [{
        name: 'send invoice',
        hooks: { load },
        fields: [{ field: 'invoice number', type: 'String' }],
      }],
    },
  };
  const {
    actions, model, app, logger,
  } = initContext(schemas, hookLoadGetResponse).inject();

  const request = { body: { data: { recordsId: [1] } } };
  const send = jest.fn((values) => values);
  const response = { status: jest.fn(() => ({ send })) };
  const perform = jest.fn(() => ({ id: 1, name: 'Jane' }));
  const implementation = {
    getModelName: jest.fn((m) => m.name),
    ResourceGetter: jest.fn(() => ({ perform })),
  };

  await actions.perform(app, model, implementation, {}, {});

  const [, , callback] = app.post.mock.calls[0];

  await callback(request, response);

  return {
    send, response, model, implementation, logger,
  };
}

describe('routes > actions', () => {
  it('should not create a route when no actions is present', async () => {
    expect.assertions(4);

    const {
      actions, model, implementation, pathService, app,
    } = initContext({ users: {} }).inject();

    await actions.perform({}, model, implementation, {}, {});

    expect(implementation.getModelName).toHaveNthReturnedWith(1, 'users');
    expect(pathService.generate).not.toHaveBeenCalled();
    expect(pathService.generateForSmartActionCustomEndpoint).not.toHaveBeenCalled();
    expect(app.post).not.toHaveBeenCalled();
  });

  it('should not create a route when actions.values or actions.hooks.* are missing', async () => {
    expect.assertions(4);

    const schema = { users: { actions: [{}, {}] } };
    const {
      actions, pathService, model, implementation, app,
    } = initContext(schema).inject();

    await actions.perform({}, model, implementation, {}, {});

    expect(implementation.getModelName).toHaveNthReturnedWith(1, 'users');
    expect(pathService.generate).not.toHaveBeenCalled();
    expect(pathService.generateForSmartActionCustomEndpoint).not.toHaveBeenCalled();
    expect(app.post).not.toHaveBeenCalled();
  });

  describe('when actions.values is present', () => {
    it('should create a route', async () => {
      expect.assertions(4);

      const schema = { users: { actions: [{ values: jest.fn(() => ({ name: 'Jane' })), name: 'send invoice' }] } };
      const {
        actions, pathService, stringUtils, model, implementation, app,
      } = initContext(schema).inject();

      await actions.perform(app, model, implementation, {}, {});

      expect(stringUtils.parameterize).toHaveBeenCalledTimes(1);
      expect(pathService.generate).toHaveBeenCalledTimes(1);
      expect(app.post).toHaveBeenCalledTimes(1);

      const [path] = app.post.mock.calls[0];
      expect(path).toBe('actions/send invoice/values');
    });

    it('should create a valid route callback', async () => {
      expect.assertions(4);

      const schemas = { users: { actions: [{ values: jest.fn(() => ({ name: 'Jane' })), name: 'send invoice' }] } };
      const {
        actions, model, implementation, app,
      } = initContext(schemas).inject();

      const request = { body: { data: { attributes: { values: { name: 'Jane' } } } } };
      const send = jest.fn((values) => values);
      const response = { status: jest.fn(() => ({ send })) };

      await actions.perform(app, model, implementation, {}, {});

      const [, , callback] = app.post.mock.calls[0];

      const result = await callback(request, response);

      expect(schemas.users.actions[0].values).toHaveBeenCalledTimes(1);
      expect(response.status).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual({ name: 'Jane' });
    });

    it('should handle async values function', async () => {
      expect.assertions(4);

      const schemas = {
        users: {
          actions: [
            { values: jest.fn(() => Promise.resolve(({ name: 'Jane' }))), name: 'send invoice' },
          ],
        },
      };
      const {
        actions, model, implementation, app,
      } = initContext(schemas).inject();

      const request = { body: { data: { attributes: { values: { name: 'Jane' } } } } };
      const send = jest.fn((values) => values);
      const response = { status: jest.fn(() => ({ send })) };

      await actions.perform(app, model, implementation, {}, {});

      const [, , callback] = app.post.mock.calls[0];

      const result = await callback(request, response);

      expect(schemas.users.actions[0].values).toHaveBeenCalledTimes(1);
      expect(response.status).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual({ name: 'Jane' });
    });
  });

  describe('when action.hooks is present', () => {
    describe('when action.hooks.load is present', () => {
      it('should create a route', async () => {
        expect.assertions(4);

        const schema = { users: { actions: [{ name: 'send invoice', hooks: { load: jest.fn() } }] } };
        const {
          actions, pathService, stringUtils, model, implementation, app,
        } = initContext(schema).inject();

        await actions.perform(app, model, implementation, {}, {});

        expect(stringUtils.parameterize).toHaveBeenCalledTimes(1);
        expect(pathService.generate).toHaveBeenCalledTimes(1);
        expect(app.post).toHaveBeenCalledTimes(1);

        const [path] = app.post.mock.calls[0];
        expect(path).toBe('actions/send invoice/hooks/load');
      });

      describe('when calling the route controller', () => {
        it('should call the load hook service', async () => {
          expect.assertions(2);

          const load = jest.fn();
          const hookLoadGetResponse = jest.fn();
          const { model, implementation } = await callLoadHook(load, hookLoadGetResponse);

          expect(implementation.ResourceGetter).toHaveBeenNthCalledWith(1, model, { recordId: 1 });
          expect(hookLoadGetResponse).toHaveBeenNthCalledWith(
            1,
            load,
            [{ field: 'invoice number', type: 'String' }],
            { id: 1, name: 'Jane' },
          );
        });

        it('should fail with message when load hook service throws', async () => {
          expect.assertions(2);

          const load = jest.fn();
          const hookLoadGetResponse = jest.fn(() => { throw new Error('oops'); });
          const { send, response } = await callLoadHook(load, hookLoadGetResponse);

          expect(response.status).toHaveBeenNthCalledWith(1, 500);
          expect(send).toHaveBeenNthCalledWith(1, { message: 'oops' });
        });

        it('should succeed with the updated fields when load hook service response', async () => {
          expect.assertions(2);

          const newFields = [{ field: 'invoice number', type: 'String', value: 'hello from load' }];

          const load = jest.fn();
          const hookLoadGetResponse = jest.fn(() => newFields);
          const { send, response } = await callLoadHook(load, hookLoadGetResponse);

          expect(response.status).toHaveBeenNthCalledWith(1, 200);
          expect(send).toHaveBeenNthCalledWith(1, newFields);
        });
      });
    });
  });
});
