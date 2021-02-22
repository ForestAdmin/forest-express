const logger = require('../../../services/logger');
const context = require('../../../context');

function getContactQueryParameter(targetFieldValue) {
  const targetField = targetFieldValue.includes('@') ? 'email' : 'external_id';

  return {
    query: {
      field: targetField,
      operator: '=',
      value: targetFieldValue,
    },
  };
}

class ContactGetter {
  static async getContact(intercomClient, Implementation, mappingValue, recordId) {
    const { modelsManager } = context.inject();
    // NOTICE: `modelFieldName` is expected to be a sequelize/mongoose field
    //         (ie. camelCase formatted)
    const [modelName, modelFieldName] = mappingValue.split('.');
    const model = modelsManager.getModels()[modelName];
    const customer = await Implementation.Intercom.getCustomer(model, recordId);
    const targetFieldValue = customer[modelFieldName];

    if (!targetFieldValue) {
      // NOTICE: `undefined` means the field does not exist.
      if (targetFieldValue === undefined) {
        logger.error(`Intercom Integration Error: No field "${modelFieldName}" on model "${modelName}"`);
      }
      // TODO: An info log should be shown here: no "mapping value" and so no intercom info
      //       can be retrieved in this context
      return null;
    }

    const queryParameter = getContactQueryParameter(targetFieldValue);

    // TODO: Replace this by a proper call to intercom.contacts.search() when available
    return intercomClient.post('/contacts/search', queryParameter);
  }
}

module.exports = ContactGetter;
