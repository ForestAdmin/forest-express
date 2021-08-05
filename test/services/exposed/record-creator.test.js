const RecordCreator = require('../../../src/services/exposed/record-creator');

describe('service > exposed > record-creator', () => {
  describe('constructor', () => {
    it('should fail to construct if missing parameters', () => {
      expect.assertions(1);

      const construct = () => new RecordCreator({ name: 'model' });
      expect(construct).toThrow(/constructor has changed/);
    });

    it('should fail to construct if querystring misses timezone', () => {
      expect.assertions(1);

      const construct = () => new RecordCreator({ name: 'model' }, { renderingId: 1 }, { timzone: 'Europe/Paris' });
      expect(construct).toThrow(/constructor has changed/);
    });
  });

  describe('create', () => {
    it('should call the ResourceCreator', () => {
      expect.assertions(5);

      const model = { name: 'model' };
      const user = { renderingId: 1 };
      const params = { timezone: 'Europe/Paris' };
      const perform = jest.fn().mockReturnValue('returnValue');
      const ResourceCreator = jest.fn().mockImplementation(() => ({ perform }));
      const context = { configStore: { Implementation: { ResourceCreator } } };
      const creator = new RecordCreator(model, user, params, context);

      const result = creator.create('myModel');
      expect(result).toStrictEqual('returnValue');
      expect(ResourceCreator).toHaveBeenCalledTimes(1);
      expect(ResourceCreator).toHaveBeenCalledWith(model, params, 'myModel', user);
      expect(perform).toHaveBeenCalledTimes(1);
      expect(perform).toHaveBeenCalledWith();
    });
  });
});
