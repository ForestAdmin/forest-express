class TwoFactorAuthenticationRequiredError extends Error {
  constructor() {
    super('Two factor authentication required');
    this.name = this.constructor.name;
    this.status = 403;
  }
}

module.exports = TwoFactorAuthenticationRequiredError;
