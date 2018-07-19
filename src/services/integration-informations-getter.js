const _ = require('lodash');

function IntegrationInformationsGetter(modelName, Implementation, integration) {
  this.perform = function () {
    const models = Implementation.getModels();
    let value = null;

    _.each(integration.mapping,
      function (mappingValue) {
        const collectionName = mappingValue.split('.')[0];
        if (models[collectionName] && Implementation
          .getModelName(models[collectionName]) === modelName) {
          value = mappingValue;
        }
      });

    return value;
  };
}

module.exports = IntegrationInformationsGetter;
