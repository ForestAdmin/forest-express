const logger = require('../../../services/logger');
const ContactGetter = require('./contact-getter');

function AttributesGetter(Implementation, params, opts, mappingValue) {
  const Intercom = opts.integrations.intercom.intercom;
  const intercom = new Intercom.Client(opts.integrations.intercom.credentials);

  this.perform = async () => {
    try {
      const contactQueryResponse = await ContactGetter
        .getContact(intercom, Implementation, mappingValue, params.recordId);

      // NOTICE: No contact found with the given `recordId` or `mappingValue`
      if (
        !contactQueryResponse
        || !contactQueryResponse.body
        || !contactQueryResponse.body.data
        || !contactQueryResponse.body.data[0]
      ) {
        return null;
      }

      const contact = contactQueryResponse.body.data[0];

      contact.city = contact.location.city;
      contact.country = contact.location.country;

      // NOTICE: This slows down the request
      const tags = await intercom.get(`/contacts/${contact.id}/tags`);
      contact.tags = tags.body.data.map((tag) => tag.name);

      // NOTICE: This slows down the request
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
