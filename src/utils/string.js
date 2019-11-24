const Inflector = require('inflected');

exports.parameterize = (value) => (value ? Inflector.parameterize(value.trim()) : '');
