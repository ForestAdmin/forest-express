const ApplicationContext = require('../../src/context/application-context');
const ActionsRoutes = require('../../src/routes/actions');

function initContext(schemas, smartActionHookGetResponse) {
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
    .addInstance('schemasGenerator', { schemas })
    .addInstance('smartActionHook', { getResponse: smartActionHookGetResponse })
    .addClass(ActionsRoutes)
    .addValue('model', { name: 'users' })
    .addValue('implementation', { getModelName: jest.fn((m) => m.name) })
    .addValue('app', { post: jest.fn() }));
  return context;
}

async function callHook(hooks, smartActionHookGetResponse, requestBody) {
  const schemas = {
    users: {
      actions: [{
        name: 'send invoice',
        hooks,
        fields: [{ field: 'invoice number', type: 'String' }],
      }],
    },
  };
  const {
    actions, model, app, logger,
  } = initContext(schemas, smartActionHookGetResponse).inject();

  const request = { body: requestBody || { recordIds: [1] } };
  const send = jest.fn((values) => values);
  const response = { status: jest.fn(() => ({ send })) };
  const perform = jest.fn(() => ({ id: 1, name: 'Jane' }));
  const implementation = {
    getModelName: jest.fn((m) => m.name),
    ResourceGetter: jest.fn(() => ({ perform })),
  };

  const schema = schemas[model.name];

  await actions.perform(app, schema, model, implementation, {}, {});

  const [, , callback] = app.post.mock.calls[0];

  await callback(request, response);

  return {
    send, response, model, implementation, logger,
  };
}

describe('routes > actions', () => {
  it('should not create a route when no actions is present', async () => {
    expect.assertions(3);

    const {
      actions, model, implementation, pathService, app, schemasGenerator,
    } = initContext({ users: {} }).inject();

    await actions.perform({}, schemasGenerator[model.name], model, implementation, {}, {});

    expect(pathService.generate).not.toHaveBeenCalled();
    expect(pathService.generateForSmartActionCustomEndpoint).not.toHaveBeenCalled();
    expect(app.post).not.toHaveBeenCalled();
  });

  it('should not create a route when actions.values or actions.hooks.* are missing', async () => {
    expect.assertions(3);

    const schema = { users: { actions: [{}, {}] } };
    const {
      actions, pathService, model, implementation, app, schemasGenerator,
    } = initContext(schema).inject();

    await actions.perform({}, schemasGenerator[model.name], model, implementation, {}, {});

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

      await actions.perform(app, schema[model.name], model, implementation, {}, {});

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

      await actions.perform(app, schemas[model.name], model, implementation, {}, {});

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

      await actions.perform(app, schemas[model.name], model, implementation, {}, {});

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

        await actions.perform(app, schema[model.name], model, implementation, {}, {});

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
          const smartActionHookGetResponse = jest.fn();
          const { model, implementation } = await callHook({ load }, smartActionHookGetResponse);

          expect(implementation.ResourceGetter).toHaveBeenNthCalledWith(1, model, { recordId: 1 });
          expect(smartActionHookGetResponse).toHaveBeenNthCalledWith(
            1,
            load,
            [{ field: 'invoice number', type: 'String' }],
            { id: 1, name: 'Jane' },
            1,
          );
        });

        it('should fail with message when load hook service throws', async () => {
          expect.assertions(2);

          const load = jest.fn();
          const smartActionHookGetResponse = jest.fn(() => { throw new Error('oops'); });
          const { send, response } = await callHook({ load }, smartActionHookGetResponse);

          expect(response.status).toHaveBeenNthCalledWith(1, 500);
          expect(send).toHaveBeenNthCalledWith(1, { message: 'oops' });
        });

        it('should succeed with the updated fields when load hook service response', async () => {
          expect.assertions(2);

          const newFields = [{ field: 'invoice number', type: 'String', value: 'hello from load' }];

          const load = jest.fn();
          const smartActionHookGetResponse = jest.fn(() => newFields);
          const { send, response } = await callHook({ load }, smartActionHookGetResponse);

          expect(response.status).toHaveBeenNthCalledWith(1, 200);
          expect(send).toHaveBeenNthCalledWith(1, { fields: newFields });
        });
      });
    });
    describe('when action.hooks.change is present', () => {
      it('should create a route', async () => {
        expect.assertions(4);

        const schema = { users: { actions: [{ name: 'send invoice', hooks: { change: { foo: jest.fn() } } }] } };
        const {
          actions, pathService, stringUtils, model, implementation, app,
        } = initContext(schema).inject();

        await actions.perform(app, schema[model.name], model, implementation, {}, {});

        expect(stringUtils.parameterize).toHaveBeenCalledTimes(1);
        expect(pathService.generate).toHaveBeenCalledTimes(1);
        expect(app.post).toHaveBeenCalledTimes(1);

        const [path] = app.post.mock.calls[0];
        expect(path).toBe('actions/send invoice/hooks/change');
      });

      describe('when calling the route controller', () => {
        it('should send undefined to hook service when change field is unreachable', async () => {
          expect.assertions(1);

          const smartActionHookGetResponse = jest.fn();
          await callHook(
            { change: { foo: jest.fn() } },
            smartActionHookGetResponse,
            { recordIds: [1], fields: [{ field: 'invoice number', type: 'String' }], changedField: 'this field does not exist' },
          );

          expect(smartActionHookGetResponse).toHaveBeenNthCalledWith(
            1,
            undefined,
            [{ field: 'invoice number', type: 'String' }],
            { id: 1, name: 'Jane' },
            1,
          );
        });

        it('should call the change hook service', async () => {
          expect.assertions(2);

          const smartActionHookGetResponse = jest.fn();
          const field = {
            field: 'foo',
            type: 'String',
            previousValue: 'a',
            value: 'b',
          };
          const change = { bar: jest.fn(), foo: jest.fn(), baz: jest.fn() };
          const { implementation, model } = await callHook(
            { change },
            smartActionHookGetResponse,
            {
              recordIds: [1],
              fields: [field],
              changedField: 'foo',
            },
          );

          expect(implementation.ResourceGetter).toHaveBeenNthCalledWith(1, model, { recordId: 1 });
          expect(smartActionHookGetResponse)
            .toHaveBeenNthCalledWith(1, change.foo, [field], { id: 1, name: 'Jane' }, 1);
        });

        it('should fail with message when change hook service throws', async () => {
          expect.assertions(2);

          const smartActionHookGetResponse = jest.fn(() => { throw new Error('oops'); });
          const field = {
            field: 'foo',
            type: 'String',
            previousValue: 'a',
            value: 'b',
          };
          const change = { bar: jest.fn(), foo: jest.fn(), baz: jest.fn() };
          const { send, response } = await callHook(
            { change },
            smartActionHookGetResponse,
            {
              recordIds: [1],
              fields: [field],
            },
          );

          expect(response.status).toHaveBeenNthCalledWith(1, 500);
          expect(send).toHaveBeenNthCalledWith(1, { message: 'oops' });
        });

        it('should succeed with the updated fields when change hook service response', async () => {
          expect.assertions(2);

          const newFields = [{
            field: 'invoice number',
            type: 'String',
            value: 'hello from load',
            previousValue: 'a',
          }];

          const smartActionHookGetResponse = jest.fn(() => newFields);
          const field = {
            field: 'foo',
            type: 'String',
            previousValue: 'a',
            value: 'b',
          };
          const change = { bar: jest.fn(), foo: jest.fn(), baz: jest.fn() };
          const { send, response } = await callHook(
            { change },
            smartActionHookGetResponse,
            {
              recordIds: [1],
              fields: [field],
            },
          );

          expect(response.status).toHaveBeenNthCalledWith(1, 200);
          expect(send).toHaveBeenNthCalledWith(1, { fields: newFields });
        });
      });
    });
  });
});
