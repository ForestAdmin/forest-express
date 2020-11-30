const ApplicationContext = require('../../src/context/application-context');
const HookLoad = require('../../src/services/hook-load');

function initContext(isSameDataStructure) {
  const context = new ApplicationContext();
  context.init((ctx) => ctx
    .addInstance('isSameDataStructure', isSameDataStructure)
    .addClass(HookLoad));

  return context;
}

describe('services > hook-load', () => {
  describe('getResponse', () => {
    it('should throw with message when load hook is not a function', async () => {
      expect.assertions(1);

      const { hookLoad } = initContext(jest.fn()).inject();

      await expect(hookLoad.getResponse(null, {}, [])).rejects.toThrow('load must be a function');
    });

    it('should throw with message when load hook does not return an object', async () => {
      expect.assertions(1);

      const { hookLoad } = initContext(jest.fn()).inject();

      await expect(hookLoad.getResponse(jest.fn(() => false), {}, []))
        .rejects.toThrow('load hook must return an object');
    });

    it('should throw with message when fields have changed', async () => {
      expect.assertions(1);

      const { hookLoad } = initContext(jest.fn(() => false)).inject();

      await expect(hookLoad.getResponse(jest.fn(() => ({})), {}, []))
        .rejects.toThrow('fields must be unchanged (no addition nor deletion allowed)');
    });

    it('should return an array of fields', async () => {
      expect.assertions(3);

      const isSameDataStructure = jest.fn(() => true);
      const { hookLoad } = initContext(isSameDataStructure).inject();
      const fields = [{
        field: 'myField',
        type: 'String',
      }];
      const expected = {
        field: 'myField',
        type: 'String',
        value: 'foo',
      };

      const load = jest.fn(() => ({
        myField: {
          field: 'myField',
          type: 'String',
          value: 'foo',
        },
      }));

      const response = await hookLoad.getResponse(load, {}, fields);
      await expect(response).toStrictEqual([expected]);
      expect(load).toHaveBeenNthCalledWith(
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
