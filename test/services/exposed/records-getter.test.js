const RecordsGetter = require('../../../src/services/exposed/records-getter.js');

describe('services > exposed > records-getter', () => {
  describe('getIdsFromRequest', () => {
    it('should return IDs as is if IDs provided', async () => {
      expect.assertions(1);
      const expectedIds = [1, 2, 3];
      const request = { body: { data: { attributes: { ids: expectedIds } } } };
      const ids = await new RecordsGetter().getIdsFromRequest(request);
      expect(ids).toBe(expectedIds);
    });
  });
});
