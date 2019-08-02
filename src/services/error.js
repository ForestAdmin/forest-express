exports.Unauthorized = (message) => {
  this.name = 'Unauthorized';
  this.status = 401;
  this.message = message;
  Error.call(this, message);
};

exports.UnprocessableEntity = (message) => {
  this.name = 'UnprocessableEntity';
  this.status = 422;
  this.message = message;
  Error.call(this, message);
};

exports.InvalidFiltersFormatError = (message) => {
  this.name = 'InvalidFiltersFormatError';
  this.message = message || 'The filters format is not a valid JSON string.';
  this.status = 422;
  Error.call(this, message);
};
