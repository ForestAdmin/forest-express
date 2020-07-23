const { is2FASaltValid } = require('../../src/utils/token-checker');

describe('utils > token-checker', () => {
  describe('checking authenticity of 2FA token', () => {
    const INVALID_2FA_ERROR_MESSAGE = 'Your 2FA token is invalid. Please use a string of 20 hexadecimal characters. You can generate it using this command: `$ openssl rand -hex 10`';

    it('should return `true`', () => {
      expect.assertions(1);
      expect(is2FASaltValid('b95be26591747d670891')).toStrictEqual(true);
    });

    it('should throw an error if the token is empty', () => {
      expect.assertions(3);
      expect(() => is2FASaltValid(undefined)).toThrow(INVALID_2FA_ERROR_MESSAGE);
      expect(() => is2FASaltValid(null)).toThrow(INVALID_2FA_ERROR_MESSAGE);
      expect(() => is2FASaltValid('')).toThrow(INVALID_2FA_ERROR_MESSAGE);
    });

    it('should throw an error if the token is not 20 characters long', () => {
      expect.assertions(1);
      expect(() => is2FASaltValid('1234')).toThrow(INVALID_2FA_ERROR_MESSAGE);
    });

    it('should throw an error if the token is not composed of hexadecimal characters only', () => {
      expect.assertions(1);
      expect(() => is2FASaltValid('NOTHEXADECIMAL123456')).toThrow(INVALID_2FA_ERROR_MESSAGE);
    });
  });
});
