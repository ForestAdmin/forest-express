const P = require('bluebird');
const useragent = require('useragent');
const logger = require('../../../services/logger');

function AttributesGetter(Implementation, params, opts, collectionName) {
  let model = null;
  const Intercom = opts.integrations.intercom.intercom;
  let intercom;

  if (opts.integrations.intercom.credentials) {
    intercom = new Intercom.Client(opts.integrations.intercom.credentials)
      .usePromises();
  } else {
    // TODO: Remove once appId/apiKey is not supported anymore.
    intercom = new Intercom.Client(
      opts.integrations.intercom.appId,
      opts.integrations.intercom.apiKey,
    ).usePromises();
  }

  this.perform = () => {
    model = Implementation.getModels()[collectionName];

    return Implementation.Intercom.getCustomer(model, params.recordId)
      .then((customer) => intercom.users.find({ email: customer.email }))
      .then((response) => response.body)
      .then((user) => {
        // jshint camelcase: false
        const agent = useragent.parse(user.user_agent_data);
        user.browser = agent.toAgent();
        user.platform = agent.os.toString();
        user.city = user.location_data.city_name;
        user.country = user.location_data.country_name;

        user.geoloc = [user.location_data.latitude,
          user.location_data.longitude];

        user.tags = user.tags.tags.map((tag) => tag.name);

        user.companies = user.companies.companies.map((company) => company.name);

        return P
          .map(user.segments.segments, (segment) => intercom.segments
            .find({ id: segment.id })
            .then((response) => response.body.name))
          .then((segments) => {
            user.segments = segments;
            return user;
          });
      })
      .catch((error) => {
        if (error.statusCode && error.statusCode !== 404) {
          logger.error('Cannot retrieve Intercom attributes for the following reason: ', error);
        }
        return null;
      });
  };
}

module.exports = AttributesGetter;
