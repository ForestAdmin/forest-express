class TwoFactorAuthenticationRequiredError extends Error {
  constructor() {
    super('Two factor authentication required');

    this.name = 'TwoFactorAuthenticationRequiredError';
    this.status = 403;
  }
}

module.exports = TwoFactorAuthenticationRequiredError;
