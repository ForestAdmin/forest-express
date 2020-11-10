module.exports = (mockExtraModules) => {
  jest.resetModules();

  let modules;
  if (mockExtraModules) {
    modules = mockExtraModules();
  }

  // NOTICE: Since src/index.js is using a singleton like pattern for
  // app, it is require to reset modules import & re-import it on each
  // test. Not calling it would result in `Liana.init` called twice
  // message
  // eslint-disable-next-line global-require
  const forestExpress = require('../../src');
  return modules ? { ...modules, forestExpress } : forestExpress;
};
