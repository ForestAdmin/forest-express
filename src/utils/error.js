/* eslint-disable max-classes-per-file */

class Unauthorized extends Error {
  constructor(message) {
    super(message);
    this.name = 'Unauthorized';
    this.status = 401;
    this.message = message;
  }
}

class UnprocessableEntity extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnprocessableEntity';
    this.status = 422;
    this.message = message;
  }
}

class InvalidFiltersFormat extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidFiltersFormat';
    this.message = message || 'The filters format is not a valid JSON string.';
    this.status = 422;
  }
}

class NoMatchingOperatorError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NoMatchingOperatorError';
    this.message = message || 'The given operator is not handled.';
    this.status = 422;
  }
}

module.exports = {
  Unauthorized,
  UnprocessableEntity,
  InvalidFiltersFormat,
  NoMatchingOperatorError,
};
