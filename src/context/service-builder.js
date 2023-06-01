/* eslint-disable global-require */
module.exports = (plan) => plan
  .addPackage('externals', require('./build-external'))
  .addPackage('values', require('./build-values'))
  .addPackage('utils', require('./build-utils'))
  .addPackage('services', require('./build-services').default);
