const { init, inject } = require('@forestadmin/context');
const ActionsRoutes = require('../../src/routes/actions');
const SmartActionHookDeserializer = require('../../src/deserializers/smart-action-hook');

function initContext(schemas, smartActionHookGetResponse) {
  init((context) => context
    .addInstance('logger', { warn: jest.fn(), error: jest.fn() })
    .addInstance('pathService', {
      generate: jest.fn((path) => path),
      generateForSmartActionCustomEndpoint: jest.fn((path) => path),
    })
    .addInstance('stringUtils', {
      parameterize: jest.fn((name) => name),
    })
    .addInstance('schemasGenerator', () => ({ schemas }))
    .addInstance('smartActionHookService', () => ({ getResponse: smartActionHookGetResponse }))
    .addInstance('smartActionHookDeserializer', () => new SmartActionHookDeserializer())
    .addUsingClass('actions', () => ActionsRoutes)
    .addValue('model', { name: 'users' })
    .addValue('implementation', { getModelName: jest.fn((m) => m.name) })
    .addValue('app', { post: jest.fn() }));
  return inject();
}

async function callHook(hooks, smartActionHookGetResponse, requestBodyDataAttributes) {
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
  } = initContext(schemas, smartActionHookGetResponse);

  const body = {
    data: {
      attributes: requestBodyDataAttributes || { ids: [1] },
    },
  };

  const request = { body, query: { timezone: 'Europe/Paris' }, user: { id: 1 } };
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
    send, response, model, implementation, logger, schema, request,
  };
}

describe('routes > actions', () => {
  it('should not create a route when no actions is present', async () => {
    const {
      actions, model, implementation, pathService, app, schemasGenerator,
    } = initContext({ users: {} });

    await actions.perform({}, schemasGenerator[model.name], model, implementation, {}, {});

    expect(pathService.generate).not.toHaveBeenCalled();
    expect(pathService.generateForSmartActionCustomEndpoint).not.toHaveBeenCalled();
    expect(app.post).not.toHaveBeenCalled();
  });

  it('should not create a route actions.hooks.* are missing', async () => {
    const schema = { users: { actions: [{}, {}] } };
    const {
      actions, pathService, model, implementation, app, schemasGenerator,
    } = initContext(schema);

    await actions.perform({}, schemasGenerator[model.name], model, implementation, {}, {});

    expect(pathService.generate).not.toHaveBeenCalled();
    expect(pathService.generateForSmartActionCustomEndpoint).not.toHaveBeenCalled();
    expect(app.post).not.toHaveBeenCalled();
  });

  describe('when action.hooks is present', () => {
    describe('when action.hooks.load is present', () => {
      it('should create a route', async () => {
        const schema = { users: { actions: [{ name: 'send invoice', hooks: { load: jest.fn() } }] } };
        const {
          actions, pathService, stringUtils, model, implementation, app,
        } = initContext(schema);

        await actions.perform(app, schema[model.name], model, implementation, {}, {});

        expect(stringUtils.parameterize).toHaveBeenCalledTimes(1);
        expect(pathService.generate).toHaveBeenCalledTimes(1);
        expect(app.post).toHaveBeenCalledTimes(1);

        const [path] = app.post.mock.calls[0];
        expect(path).toBe('actions/send invoice/hooks/load');
      });

      describe('when calling the route controller', () => {
        it('should call the load hook service', async () => {
          const load = jest.fn();
          const smartActionHookGetResponse = jest.fn();
          const { schema, request } = await callHook({ load }, smartActionHookGetResponse);

          expect(smartActionHookGetResponse).toHaveBeenNthCalledWith(
            1,
            schema.actions[0],
            load,
            [{ field: 'invoice number', type: 'String' }],
            request,
          );
        });

        it('should fail with message when load hook service throws', async () => {
          const load = jest.fn();
          const smartActionHookGetResponse = jest.fn(() => { throw new Error('oops'); });
          const { send, response } = await callHook({ load }, smartActionHookGetResponse);

          expect(response.status).toHaveBeenNthCalledWith(1, 500);
          expect(send).toHaveBeenNthCalledWith(1, { message: 'oops' });
        });

        it('should succeed with the updated fields when load hook service response', async () => {
          const newFields = [{ field: 'invoice number', type: 'String', value: 'hello from load' }];

          const load = jest.fn();
          const smartActionHookGetResponse = jest.fn(() => ({ fields: newFields }));
          const { send, response } = await callHook({ load }, smartActionHookGetResponse);

          expect(response.status).toHaveBeenNthCalledWith(1, 200);
          expect(send).toHaveBeenNthCalledWith(1, { fields: newFields });
        });
      });
    });
    describe('when action.hooks.change is present', () => {
      it('should create a route', async () => {
        const schema = { users: { actions: [{ name: 'send invoice', hooks: { change: { foo: jest.fn() } } }] } };
        const {
          actions, pathService, stringUtils, model, implementation, app,
        } = initContext(schema);

        await actions.perform(app, schema[model.name], model, implementation, {}, {});

        expect(stringUtils.parameterize).toHaveBeenCalledTimes(1);
        expect(pathService.generate).toHaveBeenCalledTimes(1);
        expect(app.post).toHaveBeenCalledTimes(1);

        const [path] = app.post.mock.calls[0];
        expect(path).toBe('actions/send invoice/hooks/change');
      });

      describe('when calling the route controller', () => {
        it('should send undefined to hook service when change field is unreachable', async () => {
          const smartActionHookGetResponse = jest.fn();
          const { schema, request } = await callHook(
            { change: { foo: jest.fn() } },
            smartActionHookGetResponse,
            { ids: [1], fields: [{ field: 'invoice number', type: 'String' }], changed_field: 'this field does not exist' },
          );

          expect(smartActionHookGetResponse).toHaveBeenNthCalledWith(
            1,
            schema.actions[0],
            undefined,
            [{ field: 'invoice number', type: 'String' }],
            request,
            undefined,
          );
        });

        it('should call the change hook service', async () => {
          const smartActionHookGetResponse = jest.fn();
          const field = {
            field: 'foo',
            type: 'String',
            previousValue: 'a',
            value: 'b',
            hook: 'foo',
          };
          const change = { bar: jest.fn(), foo: jest.fn(), baz: jest.fn() };
          const { schema, request } = await callHook(
            { change },
            smartActionHookGetResponse,
            {
              ids: [1],
              fields: [field],
              changed_field: 'foo',
            },
          );

          expect(smartActionHookGetResponse)
            .toHaveBeenNthCalledWith(1, schema.actions[0], change.foo, [field], request, field);
        });

        it('should fail with message when change hook service throws', async () => {
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
              ids: [1],
              fields: [field],
            },
          );

          expect(response.status).toHaveBeenNthCalledWith(1, 500);
          expect(send).toHaveBeenNthCalledWith(1, { message: 'oops' });
        });

        it('should succeed with the updated fields when change hook service response', async () => {
          const newFields = [{
            field: 'invoice number',
            type: 'String',
            value: 'hello from load',
            previousValue: 'a',
          }];

          const smartActionHookGetResponse = jest.fn(() => ({ fields: newFields }));
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
              ids: [1],
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
