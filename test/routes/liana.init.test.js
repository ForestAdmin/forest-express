const forestExpress = require('../../src');

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');

describe('liana > init', () => {
  describe('with a valid configuration', () => {
    it('should return a promise', async () => {
      expect.assertions(1);

      const implementation = {
        opts: {
          envSecret,
          authSecret,
        },
      };
      implementation.getModels = () => {};
      implementation.getLianaName = () => {};
      implementation.getLianaVersion = () => {};
      implementation.getOrmVersion = () => {};
      implementation.getDatabaseType = () => {};

      await forestExpress.init(implementation)
        .then((app) => {
          expect(app).toBeInstanceOf(Function);
        });
    });
  });
});
