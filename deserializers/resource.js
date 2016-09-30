'use strict';
var _ = require('lodash');
var P = require('bluebird');
var Schemas = require('../generators/schemas');

function ResourceDeserializer(Implementation, model, params, opts) {
  if (!opts) { opts = {}; }
  var schema = Schemas.schemas[Implementation.getModelName(model)];

  function extractAttributes() {
    return new P(function (resolve) {
      var attributes = params.data.attributes;
      attributes[schema.idField] = params.data.attributes[schema.idField] ||
        params.data.id;

      if (opts.omitNullAttributes) {
        attributes = _.pickBy(attributes, function (value) {
          return value;
        });
      }

      resolve(attributes);
    });
  }

  this.perform = function () {
    return extractAttributes();
  };
}

module.exports = ResourceDeserializer;

