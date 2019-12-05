const forestExpress = require('../../src');

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');


describe('liana > init', () => {
  it('should return a rejected promise', async () => {
    expect.assertions(1);

    const badConfigDir = new Date();
    const implementation = {
      opts: {
        envSecret,
        authSecret,
        configDir: badConfigDir,
      },
    };
    implementation.getModels = () => {};
    implementation.getLianaName = () => {};
    implementation.getLianaVersion = () => {};
    implementation.getOrmVersion = () => {};
    implementation.getDatabaseType = () => {};

    await forestExpress.init(implementation)
      .catch((error) => {
        expect(error).not.toBeNull();
      });
  });
});
