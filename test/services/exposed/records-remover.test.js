const RecordsRemover = require('../../../src/services/exposed/records-remover');

describe('service > exposed > records-remover', () => {
  describe('constructor', () => {
    it('should fail to construct if missing parameters', () => {
      expect.assertions(1);

      const construct = () => new RecordsRemover({ name: 'model' });
      expect(construct).toThrow(/constructor has changed/);
    });

    it('should fail to construct if querystring misses timezone', () => {
      expect.assertions(1);

      const construct = () => new RecordsRemover({ name: 'model' }, { renderingId: 1 }, { timzone: 'Europe/Paris' });
      expect(construct).toThrow(/constructor has changed/);
    });
  });

  describe('remove', () => {
    it('should call the ResourcesRemover', () => {
      expect.assertions(5);

      const model = { name: 'model' };
      const user = { renderingId: 1 };
      const params = { timezone: 'Europe/Paris' };
      const perform = jest.fn().mockReturnValue(666);
      const ResourcesRemover = jest.fn().mockImplementation(() => ({ perform }));
      const context = { configStore: { Implementation: { ResourcesRemover } } };
      const remover = new RecordsRemover(model, user, params, context);

      const result = remover.remove([1, 2, 3]);
      expect(result).toStrictEqual(666);
      expect(ResourcesRemover).toHaveBeenCalledTimes(1);
      expect(ResourcesRemover).toHaveBeenCalledWith(model, params, [1, 2, 3], user);
      expect(perform).toHaveBeenCalledTimes(1);
      expect(perform).toHaveBeenCalledWith();
    });
  });
});
