const ApplicationContext = require('../../src/context/application-context');
const HookLoad = require('../../src/services/hook-load');

function initContext(objectsHaveSameKeys) {
  const context = new ApplicationContext();
  context.init((ctx) => ctx
    .addInstance('objectsHaveSameKeys', objectsHaveSameKeys)
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

    it('should throw with message when fields properties have changed', async () => {
      expect.assertions(3);

      const objectsHaveSameKeys = jest.fn();
      objectsHaveSameKeys.mockReturnValueOnce(true).mockReturnValue(false);

      const { hookLoad } = initContext(objectsHaveSameKeys).inject();

      const load = jest.fn(() => ({
        myField: {
          field: 'myField',
          type: 'String',
          foo: 'bar', // This has been added by load function.
        },
      }));
      await expect(hookLoad.getResponse(load, {}, [{
        field: 'myField',
        type: 'String',
      }]))
        .rejects.toThrow('fields properties must be unchanged (no addition nor deletion allowed)');
      expect(objectsHaveSameKeys)
        .toHaveBeenNthCalledWith(1, { myField: { field: 'myField', type: 'String', value: null } }, { myField: { field: 'myField', type: 'String', foo: 'bar' } });
      expect(objectsHaveSameKeys)
        .toHaveBeenNthCalledWith(2, { field: 'myField', type: 'String', value: null }, { field: 'myField', type: 'String', foo: 'bar' });
    });

    it('should return an array of fields', async () => {
      expect.assertions(3);

      const objectsHaveSameKeys = jest.fn(() => true);
      const { hookLoad } = initContext(objectsHaveSameKeys).inject();
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
      expect(objectsHaveSameKeys).toHaveBeenNthCalledWith(
        1,
        { myField: { ...expected, value: null } },
        { myField: expected },
      );
      expect(objectsHaveSameKeys).toHaveBeenNthCalledWith(
        2,
        { ...expected, value: null },
        expected,
      );
    });
  });
});
