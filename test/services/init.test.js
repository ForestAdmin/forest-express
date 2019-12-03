const forestExpress = require('../../src');

describe('liana > init', () => {
  const implementation = {};
  implementation.getModels = () => {};
  implementation.getLianaName = () => {};
  implementation.getLianaVersion = () => {};
  implementation.getOrmVersion = () => {};
  implementation.getDatabaseType = () => {};

  it('should call back with app', () => {
    expect.assertions(2);

    return new Promise((resolve) => {
      const callback = (error, app) => {
        expect(error).toBeNull();
        expect(app).not.toBeNull();
        resolve();
      };
      forestExpress.init({
        ...implementation,
        opts: { callback },
      });
    });
  });
});
