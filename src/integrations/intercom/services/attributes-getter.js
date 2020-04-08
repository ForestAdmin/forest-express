const logger = require('../../../services/logger');

function AttributesGetter(Implementation, params, opts, collectionName) {
  const Intercom = opts.integrations.intercom.intercom;
  const intercom = new Intercom.Client(opts.integrations.intercom.credentials);

  this.perform = async () => {
    const model = Implementation.getModels()[collectionName];

    const customer = await Implementation.Intercom.getCustomer(model, params.recordId);

    try {
      // TODO: Replace this by a proper call to intercom.contacts.search() when available
      const contactQueryResponse = await intercom.post('/contacts/search', {
        query: {
          field: 'email',
          operator: '=',
          value: customer.email,
        },
      });
      const contact = contactQueryResponse.body.data[0];

      // NOTICE: No contact matches this ID
      if (!contact) {
        return null;
      }
      contact.city = contact.location.city;
      contact.country = contact.location.country;

      const tags = await intercom.get(`/contacts/${contact.id}/tags`);
      contact.tags = tags.body.data.map((tag) => tag.name);

      const companies = await intercom.get(`/contacts/${contact.id}/companies`);
      contact.companies = companies.body.data.map((company) => company.name);

      // NOTICE: As of v2.0, intercom API does not retrieve the segments a contact is part of
      //         You can look for a contact with a given segment id but it isn't retrieved with it
      return contact;
    } catch (error) {
      if (error.statusCode) {
        logger.error('Cannot retrieve Intercom attributes for the following reason: ', error);
      } else {
        logger.error('Internal error while retrieving Intercom attributes: ', error);
      }
      return null;
    }
  };
}

module.exports = AttributesGetter;
