const _ = require('lodash');
const { inject } = require('@forestadmin/context');

function IntegrationInformationsGetter(modelName, Implementation, integration) {
  const { modelsManager } = inject();
  this.perform = () => {
    const models = modelsManager.getModels();
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
