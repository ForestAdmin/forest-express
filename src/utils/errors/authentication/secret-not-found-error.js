class SecretNotFoundError extends Error {
  constructor() {
    super('Cannot retrieve the project you\'re trying to unlock. '
    + 'Please check that you\'re using the right environment secret regarding your project and environment.');

    this.name = 'SecretNotFoundError';
    this.status = 500;
  }
}

module.exports = SecretNotFoundError;
