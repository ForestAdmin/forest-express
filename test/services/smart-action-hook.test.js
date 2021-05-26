const ApplicationContext = require('../../src/context/application-context');
const SmartActionHook = require('../../src/services/smart-action-hook');
const SmartActionFieldValidator = require('../../src/services/smart-action-field-validator');

function initContext() {
  const context = new ApplicationContext();
  context.init((ctx) => ctx
    .addInstance('setFieldWidget', jest.fn())
    .addClass(SmartActionFieldValidator)
    .addClass(SmartActionHook));

  return context;
}

describe('services > smart-action-hook', () => {
  describe('getResponse', () => {
    it('should throw with message when hook is not a function', async () => {
      expect.assertions(1);

      const { smartActionHook } = initContext(jest.fn()).inject();

      await expect(smartActionHook.getResponse({}, null, [], {})).rejects.toThrow('hook must be a function');
    });

    it('should throw with message when hook does not return an array', async () => {
      expect.assertions(1);

      const { smartActionHook } = initContext(jest.fn()).inject();

      await expect(smartActionHook.getResponse({}, jest.fn(() => false), [], {}))
        .rejects.toThrow('hook must return an array');
    });

    it('should return an array of fields', async () => {
      expect.assertions(2);

      const { smartActionHook } = initContext().inject();
      const field = {
        field: 'myField',
        type: 'String',
      };
      const fields = [field];
      const expected = {
        field: 'myField',
        type: 'String',
        value: 'foo',
      };

      const hook = jest.fn(() => ([{
        field: 'myField',
        type: 'String',
        value: 'foo',
      }]));

      const response = await smartActionHook.getResponse({}, hook, fields, {});
      await expect(response).toStrictEqual([expected]);
      expect(hook).toHaveBeenNthCalledWith(
        1,
        {
          fields: [{ ...field, value: null }],
          record: {},
          changedField: null,
        },
      );
    });

    describe('when user change fields array inside the hook', () => {
      describe('when user add a field', () => {
        it('should have one more field', async () => {
          expect.assertions(2);

          const { smartActionHook } = initContext().inject();
          const field = {
            field: 'myField',
            type: 'String',
            value: 'foo',
          };
          const addedField = {
            field: 'myNewField',
            type: 'String',
            value: 'bar',
          };

          const fields = [field];
          const expected = [field, addedField];

          const hook = jest.fn(() => (expected));

          const response = await smartActionHook.getResponse({}, hook, fields, {});
          await expect(response).toStrictEqual(expected);
          expect(hook).toHaveBeenNthCalledWith(
            1,
            {
              fields,
              record: {},
              changedField: null,
            },
          );
        });

        it('should assign null value if no one is provided', async () => {
          expect.assertions(2);

          const { smartActionHook } = initContext().inject();
          const field = {
            field: 'myField',
            type: 'String',
            value: 'foo',
          };
          const addedField = {
            field: 'myNewField',
            type: 'String',
          };

          const fields = [field];
          const expected = [field, {
            ...addedField,
            value: null,
          }];

          const hook = jest.fn(() => ([field, addedField]));

          const response = await smartActionHook.getResponse({}, hook, fields, {});
          await expect(response).toStrictEqual(expected);
          expect(hook).toHaveBeenNthCalledWith(
            1,
            {
              fields,
              record: {},
              changedField: null,
            },
          );
        });

        it('should throw an error if the new field is malformed', async () => {
          expect.assertions(1);

          const { smartActionHook } = initContext().inject();
          const action = { name: 'actionTest' };

          const field = {
            field: 'myField',
            type: 'String',
            value: 'foo',
          };
          const addedField = {
            type: 'String',
          };

          const fields = [field, addedField];

          const hook = jest.fn(() => ([field, addedField]));

          await expect(smartActionHook.getResponse(action, hook, fields, {}))
            .rejects.toThrow(`field attribute inside fileds array on the smart action "${action.name}" must be defined.`);
        });

        it('should throw an error if the fiel have an undefined hook', async () => {
          expect.assertions(1);

          const { smartActionHook } = initContext().inject();
          const action = { name: 'actionTest', hooks: { change: {} } };

          const field = {
            field: 'myField',
            type: 'String',
            value: 'foo',
          };
          const addedField = {
            type: 'String',
            field: 'myNewField',
            hook: 'undefinedHook',
          };

          const fields = [field, addedField];

          const hook = jest.fn(() => ([field, addedField]));

          await expect(smartActionHook.getResponse(action, hook, fields, {}))
            .rejects.toThrow(`The hook "${addedField.hook}" of "${addedField.field}" field on the smart action "${action.name}" is not defined.`);
        });
      });

      it('should have one less filed', async () => {
        expect.assertions(2);

        const { smartActionHook } = initContext().inject();
        const field = {
          field: 'myField',
          type: 'String',
          value: 'foo',
        };
        const anotherField = {
          field: 'myNewField',
          type: 'String',
          value: 'bar',
        };

        const fields = [field, anotherField];
        const expected = [field];

        const hook = jest.fn(() => (expected));

        const response = await smartActionHook.getResponse({}, hook, fields, {});
        await expect(response).toStrictEqual(expected);
        expect(hook).toHaveBeenNthCalledWith(
          1,
          {
            fields,
            record: {},
            changedField: null,
          },
        );
      });
    });

    describe('when field has enums', () => {
      describe('when field value is a single value', () => {
        it('should reset value when it has been dropped from enum', async () => {
          expect.assertions(1);

          const { smartActionHook } = initContext().inject();
          const field = {
            field: 'myField',
            type: 'Enum',
            enums: ['a', 'b', 'c'],
            value: 'b',
          };
          const fields = [field];
          const expected = {
            ...field,
            enums: ['d', 'e', 'f'],
            value: null,
          };

          const hook = jest.fn(() => ([
            { ...field, enums: ['d', 'e', 'f'] },
          ]));

          const response = await smartActionHook.getResponse({}, hook, fields, {});
          await expect(response).toStrictEqual([expected]);
        });

        it('should keep value when it is still present in enums', async () => {
          expect.assertions(1);

          const { smartActionHook } = initContext().inject();
          const field = {
            field: 'myField',
            type: 'Enum',
            enums: ['a', 'b', 'c'],
            value: 'b',
          };
          const fields = [field];
          const expected = {
            ...field,
            enums: ['d', 'e', 'f'],
            value: 'e',
          };

          const hook = jest.fn(() => ([
            { ...field, enums: ['d', 'e', 'f'], value: 'e' },
          ]));

          const response = await smartActionHook.getResponse({}, hook, fields, {});
          await expect(response).toStrictEqual([expected]);
        });
      });

      describe('when field value can be an array', () => {
        it('should reset value when it has been dropped from enum', async () => {
          expect.assertions(1);

          const { smartActionHook } = initContext().inject();
          const field = {
            field: 'myField',
            type: ['Enum'],
            enums: ['a', 'b', 'c'],
            value: ['a', 'b'],
          };
          const fields = [field];
          const expected = {
            ...field,
            enums: ['d', 'e', 'f'],
            value: null,
          };

          const hook = jest.fn(() => ([
            { ...field, enums: ['d', 'e', 'f'] },
          ]));

          const response = await smartActionHook.getResponse({}, hook, fields, {});
          await expect(response).toStrictEqual([expected]);
        });

        it('should keep value when it is still present in enums', async () => {
          expect.assertions(1);

          const { smartActionHook } = initContext().inject();
          const field = {
            field: 'myField',
            type: ['Enum'],
            enums: ['a', 'b', 'c'],
            value: ['a'],
          };
          const fields = [field];
          const expected = {
            ...field,
            enums: ['a', 'b', 'c', 'd', 'e', 'f'],
            value: ['a', 'b'],
          };

          const hook = jest.fn(() => ([
            { ...field, enums: ['a', 'b', 'c', 'd', 'e', 'f'], value: ['a', 'b'] },
          ]));

          const response = await smartActionHook.getResponse({}, hook, fields, {});
          await expect(response).toStrictEqual([expected]);
        });
      });
    });
  });
});
