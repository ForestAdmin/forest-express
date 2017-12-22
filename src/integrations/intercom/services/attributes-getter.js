'use strict';
var P = require('bluebird');
var useragent = require('useragent');
var logger = require('../../../services/logger');

function AttributesGetter(Implementation, params, opts, collectionName) {
  var model = null;
  var Intercom = opts.integrations.intercom.intercom;
  var intercom;

  if (opts.integrations.intercom.credentials) {
    intercom = new Intercom.Client(opts.integrations.intercom.credentials)
      .usePromises();
  } else {
    // TODO: Remove once appId/apiKey is not supported anymore.
    intercom = new Intercom.Client(opts.integrations.intercom.appId,
      opts.integrations.intercom.apiKey).usePromises();
  }

  this.perform = function () {
    model = Implementation.getModels()[collectionName];

    return Implementation.Intercom.getCustomer(model, params.recordId)
      .then(function (customer) {
        return intercom.users.find({ email: customer.email });
      })
      .then(function (response) {
        return response.body;
      })
      .then(function (user) {
        // jshint camelcase: false
        var agent = useragent.parse(user.user_agent_data);
        user.browser = agent.toAgent();
        user.platform = agent.os.toString();
        user.city = user.location_data.city_name;
        user.country = user.location_data.country_name;

        user.geoloc = [user.location_data.latitude,
          user.location_data.longitude];

        user.tags = user.tags.tags.map(function (tag) {
          return tag.name;
        });

        user.companies = user.companies.companies.map(function (company) {
          return company.name;
        });

        return P
          .map(user.segments.segments, function (segment) {
            return intercom.segments
              .find({ id: segment.id })
              .then(function (response) {
                return response.body.name;
              });
          })
          .then(function (segments) {
            user.segments = segments;
            return user;
          });
      })
      .catch(function (error) {
        if (error.statusCode && error.statusCode !== 404) {
          logger.error('Cannot retrieve Intercom attributes for the following reason:', error);
        }
        return null;
      });
  };
}

module.exports = AttributesGetter;
