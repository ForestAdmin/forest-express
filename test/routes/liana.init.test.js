const forestExpress = require('../../src');
const isFunction = require('../helpers/isFunction');

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');


describe('liana > init', () => {
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
        expect(isFunction(app)).toBe(true);
      });
  });
});
