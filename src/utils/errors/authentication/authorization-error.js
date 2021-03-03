class AuthorizationError extends Error {
  constructor(status, message) {
    super(message || 'Error while authorizing the user on Forest Admin');
    this.name = this.constructor.name;
    this.status = status || 500;
  }
}

module.exports = AuthorizationError;
