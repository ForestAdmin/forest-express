'use strict';
var _ = require('lodash');

function IntegrationInformationsGetter(modelName, Implementation, integration) {
  this.perform = function () {
    var models = Implementation.getModels();
    var value = null;

    _.each(integration.mapping,
      function (mappingValue) {
        var collectionName = mappingValue.split('.')[0];
        if (models[collectionName] && Implementation
              .getModelName(models[collectionName]) === modelName) {
          value = mappingValue;
        }
      });

    return value;
  };
}

module.exports = IntegrationInformationsGetter;
