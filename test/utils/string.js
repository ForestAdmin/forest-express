const chai = require('chai');
const StringUtil = require('../../src/utils/string');

const { expect } = chai;

describe('Utils > String', () => {
  describe('parameterize function', () => {
    it('should exist', () => {
      expect(StringUtil.parameterize).not.to.be.undefined;
    });

    describe('with a null string argument', () => {
      it('should return an empty string', () => {
        expect(StringUtil.parameterize(null)).equal('');
      });
    });

    describe('with a string with spaces', () => {
      it('should replace the spaces by dashes (-)', () => {
        expect(StringUtil.parameterize('add transaction')).equal('add-transaction');
      });

      it('should lowercase the characters', () => {
        expect(StringUtil.parameterize('Add Transaction')).equal('add-transaction');
      });

      it('should trim extra spaces', () => {
        expect(StringUtil.parameterize(' add transaction ')).equal('add-transaction');
      });

      it('should replace accented characters with their ascii equivalents', () => {
        expect(StringUtil.parameterize('add trénsàction')).equal('add-trensaction');
      });
    });
  });
});
