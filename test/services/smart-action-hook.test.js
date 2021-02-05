const ApplicationContext = require('../../src/context/application-context');
const SmartActionHook = require('../../src/services/smart-action-hook');

function initContext(isSameDataStructure) {
  const context = new ApplicationContext();
  context.init((ctx) => ctx
    .addInstance('isSameDataStructure', isSameDataStructure)
    .addInstance('setFieldWidget', jest.fn())
    .addClass(SmartActionHook));

  return context;
}

describe('services > smart-action-hook', () => {
  describe('getResponse', () => {
    it('should throw with message when hook is not a function', async () => {
      expect.assertions(1);

      const { smartActionHook } = initContext(jest.fn()).inject();

      await expect(smartActionHook.getResponse(null, [], {})).rejects.toThrow('hook must be a function');
    });

    it('should throw with message when hook does not return an object', async () => {
      expect.assertions(1);

      const { smartActionHook } = initContext(jest.fn()).inject();

      await expect(smartActionHook.getResponse(jest.fn(() => false), [], {}))
        .rejects.toThrow('hook must return an object');
    });

    it('should throw with message when fields have changed', async () => {
      expect.assertions(1);

      const { smartActionHook } = initContext(jest.fn(() => false)).inject();

      await expect(smartActionHook.getResponse(jest.fn(() => ({})), [], {}))
        .rejects.toThrow('fields must be unchanged (no addition nor deletion allowed)');
    });

    it('should return an array of fields', async () => {
      expect.assertions(3);

      const isSameDataStructure = jest.fn(() => true);
      const { smartActionHook } = initContext(isSameDataStructure).inject();
      const fields = [{
        field: 'myField',
        type: 'String',
      }];
      const expected = {
        field: 'myField',
        type: 'String',
        value: 'foo',
      };

      const hook = jest.fn(() => ({
        myField: {
          field: 'myField',
          type: 'String',
          value: 'foo',
        },
      }));

      const response = await smartActionHook.getResponse(hook, fields, {});
      await expect(response).toStrictEqual([expected]);
      expect(hook).toHaveBeenNthCalledWith(
        1,
        {
          fields: { myField: { ...expected, value: null } },
          record: {},
        },
      );
      expect(isSameDataStructure).toHaveBeenNthCalledWith(
        1,
        { myField: { ...expected, value: null } },
        { myField: expected },
        1,
      );
    });

    describe('when field has enums', () => {
      describe('when field value is a single value', () => {
        it('should reset value when it has been dropped from enum', async () => {
          expect.assertions(1);

          const isSameDataStructure = jest.fn(() => true);
          const { smartActionHook } = initContext(isSameDataStructure).inject();
          const fields = [{
            field: 'myField',
            type: 'Enum',
            enums: ['a', 'b', 'c'],
            value: 'b',
          }];
          const expected = {
            ...fields[0],
            enums: ['d', 'e', 'f'],
            value: null,
          };

          const hook = jest.fn(() => ({
            myField: { ...fields[0], enums: ['d', 'e', 'f'] },
          }));

          const response = await smartActionHook.getResponse(hook, fields, {});
          await expect(response).toStrictEqual([expected]);
        });

        it('should keep value when it is still present in enums', async () => {
          expect.assertions(1);

          const isSameDataStructure = jest.fn(() => true);
          const { smartActionHook } = initContext(isSameDataStructure).inject();
          const fields = [{
            field: 'myField',
            type: 'Enum',
            enums: ['a', 'b', 'c'],
            value: 'b',
          }];
          const expected = {
            ...fields[0],
            enums: ['d', 'e', 'f'],
            value: 'e',
          };

          const hook = jest.fn(() => ({
            myField: { ...fields[0], enums: ['d', 'e', 'f'], value: 'e' },
          }));

          const response = await smartActionHook.getResponse(hook, fields, {});
          await expect(response).toStrictEqual([expected]);
        });
      });

      describe('when field value can be an array', () => {
        it('should reset value when it has been dropped from enum', async () => {
          expect.assertions(1);

          const isSameDataStructure = jest.fn(() => true);
          const { smartActionHook } = initContext(isSameDataStructure).inject();
          const fields = [{
            field: 'myField',
            type: ['Enum'],
            enums: ['a', 'b', 'c'],
            value: ['a', 'b'],
          }];
          const expected = {
            ...fields[0],
            enums: ['d', 'e', 'f'],
            value: null,
          };

          const hook = jest.fn(() => ({
            myField: { ...fields[0], enums: ['d', 'e', 'f'] },
          }));

          const response = await smartActionHook.getResponse(hook, fields, {});
          await expect(response).toStrictEqual([expected]);
        });

        it('should keep value when it is still present in enums', async () => {
          expect.assertions(1);

          const isSameDataStructure = jest.fn(() => true);
          const { smartActionHook } = initContext(isSameDataStructure).inject();
          const fields = [{
            field: 'myField',
            type: ['Enum'],
            enums: ['a', 'b', 'c'],
            value: ['a'],
          }];
          const expected = {
            ...fields[0],
            enums: ['a', 'b', 'c', 'd', 'e', 'f'],
            value: ['a', 'b'],
          };

          const hook = jest.fn(() => ({
            myField: { ...fields[0], enums: ['a', 'b', 'c', 'd', 'e', 'f'], value: ['a', 'b'] },
          }));

          const response = await smartActionHook.getResponse(hook, fields, {});
          await expect(response).toStrictEqual([expected]);
        });
      });
    });
  });
});
