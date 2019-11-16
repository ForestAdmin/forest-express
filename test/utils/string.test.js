const StringUtil = require('../../src/utils/string');

describe('utils > string', () => {
  describe('parameterize function', () => {
    it('should exist', () => {
      expect.assertions(1);
      expect(StringUtil.parameterize).not.toBeUndefined();
    });

    describe('with a null string argument', () => {
      it('should return an empty string', () => {
        expect.assertions(1);
        expect(StringUtil.parameterize(null)).toStrictEqual('');
      });
    });

    describe('with a string with spaces', () => {
      it('should replace the spaces by dashes (-)', () => {
        expect.assertions(1);
        expect(StringUtil.parameterize('add transaction')).toStrictEqual('add-transaction');
      });

      it('should lowercase the characters', () => {
        expect.assertions(1);
        expect(StringUtil.parameterize('Add Transaction')).toStrictEqual('add-transaction');
      });

      it('should trim extra spaces', () => {
        expect.assertions(1);
        expect(StringUtil.parameterize(' add transaction ')).toStrictEqual('add-transaction');
      });

      it('should replace accented characters with their ascii equivalents', () => {
        expect.assertions(1);
        expect(StringUtil.parameterize('add trénsàction')).toStrictEqual('add-trensaction');
      });
    });
  });
});
