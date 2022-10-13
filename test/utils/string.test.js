const StringUtil = require('../../src/utils/string');

describe('utils > string', () => {
  describe('parameterize function', () => {
    it('should exist', () => {
      expect(StringUtil.parameterize).toBeDefined();
    });

    describe('with a null string argument', () => {
      it('should return an empty string', () => {
        expect(StringUtil.parameterize(null)).toBe('');
      });
    });

    describe('with a string with spaces', () => {
      it('should replace the spaces by dashes (-)', () => {
        expect(StringUtil.parameterize('add transaction')).toBe('add-transaction');
      });

      it('should lowercase the characters', () => {
        expect(StringUtil.parameterize('Add Transaction')).toBe('add-transaction');
      });

      it('should trim extra spaces', () => {
        expect(StringUtil.parameterize(' add transaction ')).toBe('add-transaction');
      });

      it('should replace accented characters with their ascii equivalents', () => {
        expect(StringUtil.parameterize('add trénsàction')).toBe('add-trensaction');
      });
    });
  });
});
