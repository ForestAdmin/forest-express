const RecordsCounter = require('../../../src/services/exposed/records-counter');

describe('service > exposed > record-counter', () => {
  describe('constructor', () => {
    it('should fail to construct if missing parameters', () => {
      expect.assertions(1);

      const construct = () => new RecordsCounter({ name: 'model' });
      expect(construct).toThrow(/constructor has changed/);
    });

    it('should fail to construct if querystring misses timezone', () => {
      expect.assertions(1);

      const construct = () => new RecordsCounter({ name: 'model' }, { renderingId: 1 }, { timzone: 'Europe/Paris' });
      expect(construct).toThrow(/constructor has changed/);
    });
  });

  describe('count', () => {
    it('should call the ResourcesGetter', () => {
      expect.assertions(5);

      const model = { name: 'model' };
      const user = { renderingId: 1 };
      const params = { timezone: 'Europe/Paris' };
      const count = jest.fn().mockReturnValue(666);
      const ResourcesGetter = jest.fn().mockImplementation(() => ({ count }));
      const context = { configStore: { lianaOptions: 'lianaOptions', Implementation: { ResourcesGetter } } };
      const counter = new RecordsCounter(model, user, params, context);

      const result = counter.count();
      expect(result).toStrictEqual(666);
      expect(ResourcesGetter).toHaveBeenCalledTimes(1);
      expect(ResourcesGetter).toHaveBeenCalledWith(model, 'lianaOptions', params, user);
      expect(count).toHaveBeenCalledTimes(1);
      expect(count).toHaveBeenCalledWith();
    });
  });
});
