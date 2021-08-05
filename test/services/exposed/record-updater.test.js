const RecordUpdater = require('../../../src/services/exposed/record-updater');

describe('service > exposed > record-updater', () => {
  describe('constructor', () => {
    it('should fail to construct if missing parameters', () => {
      expect.assertions(1);

      const construct = () => new RecordUpdater({ name: 'model' });
      expect(construct).toThrow(/constructor has changed/);
    });

    it('should fail to construct if querystring misses timezone', () => {
      expect.assertions(1);

      const construct = () => new RecordUpdater({ name: 'model' }, { renderingId: 1 }, { timzone: 'Europe/Paris' });
      expect(construct).toThrow(/constructor has changed/);
    });
  });

  describe('update', () => {
    it('should call the ResourceUpdater', () => {
      expect.assertions(5);

      const model = { name: 'model' };
      const user = { renderingId: 1 };
      const params = { timezone: 'Europe/Paris' };
      const perform = jest.fn().mockReturnValue('returnValue');
      const ResourceUpdater = jest.fn().mockImplementation(() => ({ perform }));
      const context = { configStore: { Implementation: { ResourceUpdater } } };
      const updater = new RecordUpdater(model, user, params, context);

      const result = updater.update({ newValue: true }, 66);
      expect(result).toStrictEqual('returnValue');
      expect(ResourceUpdater).toHaveBeenCalledTimes(1);
      expect(ResourceUpdater).toHaveBeenCalledWith(model, { timezone: 'Europe/Paris', recordId: 66 }, { newValue: true }, user);
      expect(perform).toHaveBeenCalledTimes(1);
      expect(perform).toHaveBeenCalledWith();
    });
  });
});
