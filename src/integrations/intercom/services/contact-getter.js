const logger = require('../../../services/logger');

const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function getContactQueryParameter(targetFieldValue) {
  const targetField = targetFieldValue.match(EMAIL_REGEX) ? 'email' : 'external_id';

  return {
    query: {
      field: targetField,
      operator: '=',
      value: targetFieldValue,
    },
  };
}

class ContactGetter {
  static async getContact(intercomClient, Implementation, mappingValue, customerId) {
    // NOTICE: `modelFieldName` is expected to be a sequelize/mongoose field
    //         (ie. camelCase formatted)
    const [modelName, modelFieldName] = mappingValue.split('.');
    const model = Implementation.getModels()[modelName];
    const customer = await Implementation.Intercom.getCustomer(model, customerId);
    const targetFieldValue = customer[modelFieldName];

    if (!targetFieldValue) {
      // NOTICE: `undefined` means the field does not exist.
      if (targetFieldValue === undefined) {
        logger.error(`Intercom Integration Error: No field "${modelFieldName}" on model "${modelName}"`);
      }
      // TODO: A 404 (no intercom data for this record) should be returned here.
      return null;
    }

    const queryParameter = getContactQueryParameter(targetFieldValue);

    // TODO: Replace this by a proper call to intercom.contacts.search() when available
    return intercomClient.post('/contacts/search', queryParameter);
  }
}

module.exports = ContactGetter;
