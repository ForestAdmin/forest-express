function Unauthorized(message) {
  this.name = 'Unauthorized';
  this.status = 401;
  this.message = message;
  Error.call(this, message);
}

function UnprocessableEntity(message) {
  this.name = 'UnprocessableEntity';
  this.status = 422;
  this.message = message;
  Error.call(this, message);
}

function InvalidFiltersFormat(message) {
  this.name = 'InvalidFiltersFormat';
  this.message = message || 'The filters format is not a valid JSON string.';
  this.status = 422;
  Error.call(this, message);
}

function NoMatchingOperatorError(message) {
  this.name = 'NoMatchingOperatorError';
  this.message = message || 'The given operator is not handled.';
  this.status = 422;
  Error.call(this, message);
}

module.exports = {
  Unauthorized,
  UnprocessableEntity,
  InvalidFiltersFormat,
  NoMatchingOperatorError,
};
