const forestUrlGetter = require('../../src/utils/forest-url-getter');

describe('utils › forestUrlGetter', () => {
  describe('when no process.env.FOREST_URL is provided', () => {
    it('should return the default forest api url', () => {
      expect.assertions(1);
      expect(forestUrlGetter()).toStrictEqual('https://api.forestadmin.com');
    });
  });

  describe('when process.env.FOREST_URL is set', () => {
    it('should return the process.env.FOREST_URL value', () => {
      expect.assertions(1);
      const previousProcessEnv = process.env;
      const FOREST_URL = 'https://another.random.api.url';
      process.env = {
        FOREST_URL,
      };
      expect(forestUrlGetter()).toStrictEqual(FOREST_URL);
      process.env = previousProcessEnv;
    });
  });
});
