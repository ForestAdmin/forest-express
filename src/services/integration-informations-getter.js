const _ = require('lodash');

function IntegrationInformationsGetter(modelName, Implementation, integration) {
  this.perform = () => {
    const models = Implementation.getModels();
    let value = null;

    _.each(integration.mapping, (mappingValue) => {
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
