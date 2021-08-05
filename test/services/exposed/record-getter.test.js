const RecordGetter = require('../../../src/services/exposed/record-getter');

describe('service > exposed > record-getter', () => {
  describe('constructor', () => {
    it('should fail to construct if missing parameters', () => {
      expect.assertions(1);

      const construct = () => new RecordGetter({ name: 'model' });
      expect(construct).toThrow(/constructor has changed/);
    });

    it('should fail to construct if querystring misses timezone', () => {
      expect.assertions(1);

      const construct = () => new RecordGetter({ name: 'model' }, { renderingId: 1 }, { timzone: 'Europe/Paris' });
      expect(construct).toThrow(/constructor has changed/);
    });
  });

  describe('get', () => {
    it('should call the ResourceGetter', () => {
      expect.assertions(5);

      const model = { name: 'model' };
      const user = { renderingId: 1 };
      const params = { timezone: 'Europe/Paris' };
      const perform = jest.fn().mockReturnValue('returnValue');
      const ResourceGetter = jest.fn().mockImplementation(() => ({ perform }));
      const context = { configStore: { Implementation: { ResourceGetter } } };
      const getter = new RecordGetter(model, user, params, context);

      const result = getter.get(66);
      expect(result).toStrictEqual('returnValue');
      expect(ResourceGetter).toHaveBeenCalledTimes(1);
      expect(ResourceGetter).toHaveBeenCalledWith(model, { timezone: 'Europe/Paris', recordId: 66 }, user);
      expect(perform).toHaveBeenCalledTimes(1);
      expect(perform).toHaveBeenCalledWith();
    });
  });
});
