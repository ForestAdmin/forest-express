const { init, inject } = require('@forestadmin/context');
const SmartActionHookService = require('../../src/services/smart-action-hook-service');
const SmartActionFieldValidator = require('../../src/services/smart-action-field-validator');
const SmartActionFormLayoutService = require('../../src/services/smart-action-form-layout-service');

const setup = () => {
  init((context) => context
    .addInstance('setFieldWidget', () => jest.fn())
    .addUsingClass('smartActionFieldValidator', () => SmartActionFieldValidator)
    .addUsingClass('smartActionFormLayoutService', () => SmartActionFormLayoutService)
    .addUsingClass('smartActionHookService', () => SmartActionHookService));

  return inject();
};

describe('services > smart-action-hook', () => {
  describe('getResponse', () => {
    it('should throw with message when hook is not a function', async () => {
      const { smartActionHookService } = setup();

      await expect(smartActionHookService.getResponse({}, null, [], {})).rejects.toThrow('hook must be a function');
    });

    it('should throw with message when hook does not return an array', async () => {
      const { smartActionHookService } = setup();

      await expect(smartActionHookService.getResponse({}, jest.fn(() => false), [], {}))
        .rejects.toThrow('hook must return an array');
    });

    it('should return an object containing an array of fields and a layout', async () => {
      const { smartActionHookService } = setup();
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

      const response = await smartActionHookService.getResponse({}, hook, fields, {});
      await expect(response).toStrictEqual({ fields: [expected], layout: [] });
      expect(hook).toHaveBeenNthCalledWith(
        1,
        {
          fields: [{ ...field, value: null }],
          request: {},
          changedField: null,
        },
      );
    });

    describe('when user change fields array inside the hook', () => {
      describe('when user add a field', () => {
        it('should have one more field', async () => {
          const { smartActionHookService } = setup();
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

          const response = await smartActionHookService.getResponse({}, hook, fields, {});
          await expect(response).toStrictEqual({ fields: expected, layout: [] });
          expect(hook).toHaveBeenNthCalledWith(
            1,
            {
              fields,
              request: {},
              changedField: null,
            },
          );
        });

        describe('when the new field has no value defined', () => {
          it('should assign value to null', async () => {
            const { smartActionHookService } = setup();
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

            const response = await smartActionHookService.getResponse({}, hook, fields, {});
            await expect(response).toStrictEqual({ fields: expected, layout: [] });
            expect(hook).toHaveBeenNthCalledWith(
              1,
              {
                fields,
                request: {},
                changedField: null,
              },
            );
          });
        });

        describe('when the new field is malformed', () => {
          it('should throw an error', async () => {
            const { smartActionHookService } = setup();
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

            await expect(smartActionHookService.getResponse(action, hook, fields, {}))
              .rejects.toThrow(`field attribute inside fields array on the smart action "${action.name}" must be defined.`);
          });
        });

        it('should throw an error if the fiel have an undefined hook', async () => {
          const { smartActionHookService } = setup();
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

          await expect(smartActionHookService.getResponse(action, hook, fields, {}))
            .rejects.toThrow(`The hook "${addedField.hook}" of "${addedField.field}" field on the smart action "${action.name}" is not defined.`);
        });
      });

      describe('when user remove a field', () => {
        it('should have one less field', async () => {
          const { smartActionHookService } = setup();
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

          const response = await smartActionHookService.getResponse({}, hook, fields, {});
          await expect(response).toStrictEqual({ fields: expected, layout: [] });
          expect(hook).toHaveBeenNthCalledWith(
            1,
            {
              fields,
              request: {},
              changedField: null,
            },
          );
        });
      });
    });

    describe('when field has enums', () => {
      describe('when field value is a single value', () => {
        it('should reset value when it has been dropped from enum', async () => {
          const { smartActionHookService } = setup();
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

          const response = await smartActionHookService.getResponse({}, hook, fields, {});
          await expect(response).toStrictEqual({ fields: [expected], layout: [] });
        });

        it('should keep value when it is still present in enums', async () => {
          const { smartActionHookService } = setup();
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

          const response = await smartActionHookService.getResponse({}, hook, fields, {});
          await expect(response).toStrictEqual({ fields: [expected], layout: [] });
        });
      });

      describe('when field value can be an array', () => {
        it('should reset value when it has been dropped from enum', async () => {
          const { smartActionHookService } = setup();
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

          const response = await smartActionHookService.getResponse({}, hook, fields, {});
          await expect(response).toStrictEqual({ fields: [expected], layout: [] });
        });

        it('should keep value when it is still present in enums', async () => {
          const { smartActionHookService } = setup();
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

          const response = await smartActionHookService.getResponse({}, hook, fields, {});
          await expect(response).toStrictEqual({ fields: [expected], layout: [] });
        });
      });
    });
  });
});
