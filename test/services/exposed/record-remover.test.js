const RecordRemover = require('../../../src/services/exposed/record-remover');

describe('service > exposed > record-remover', () => {
  describe('constructor', () => {
    it('should fail to construct if missing parameters', () => {
      expect.assertions(1);

      const construct = () => new RecordRemover({ name: 'model' });
      expect(construct).toThrow(/constructor has changed/);
    });

    it('should fail to construct if querystring misses timezone', () => {
      expect.assertions(1);

      const construct = () => new RecordRemover({ name: 'model' }, { renderingId: 1 }, { timzone: 'Europe/Paris' });
      expect(construct).toThrow(/constructor has changed/);
    });
  });

  describe('remove', () => {
    it('should call the ResourceRemover', () => {
      expect.assertions(5);

      const model = { name: 'model' };
      const user = { renderingId: 1 };
      const params = { timezone: 'Europe/Paris' };
      const perform = jest.fn().mockReturnValue('returnValue');
      const ResourceRemover = jest.fn().mockImplementation(() => ({ perform }));
      const context = { configStore: { Implementation: { ResourceRemover } } };
      const remover = new RecordRemover(model, user, params, context);

      const result = remover.remove(66);
      expect(result).toStrictEqual('returnValue');
      expect(ResourceRemover).toHaveBeenCalledTimes(1);
      expect(ResourceRemover).toHaveBeenCalledWith(model, { timezone: 'Europe/Paris', recordId: 66 }, user);
      expect(perform).toHaveBeenCalledTimes(1);
      expect(perform).toHaveBeenCalledWith();
    });
  });
});
