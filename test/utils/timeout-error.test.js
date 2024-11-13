const timeoutError = require('../../src/utils/timeout-error');

describe('utils > timeoutError', () => {
  describe('if the error is a timeout', () => {
    it('should format an error message', () => {
      const mockDate = new Date(1466424490000);
      const spy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      expect(timeoutError('http://example.test/path/to/ressource?id=123', { timeout: true })).toBe('The request to Forest Admin server has timed out while trying to reach http://example.test/path/to/ressource?id=123 at 2016-06-20T12:08:10.000Z');
      spy.mockRestore();
    });
  });
  describe('if the error is not a timeout', () => {
    it('should return null', () => {
      expect(timeoutError('http://example.test/path/to/ressource?id=123', { timeout: false })).toBeNull();
    });
  });
});
