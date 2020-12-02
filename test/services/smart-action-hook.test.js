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
  });
});
