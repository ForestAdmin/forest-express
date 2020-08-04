const ALGORITHM_DEFAULT = process.env.JWT_ALGORITHM || 'HS256';
const CONFIGURATION_DEFAULT = {
  algorithms: [ALGORITHM_DEFAULT],
  credentialsRequired: false,
};

module.exports = {
  getJWTConfiguration: (configuration) => ({
    ...CONFIGURATION_DEFAULT,
    ...configuration,
  }),
};
