'use strict';
var _ = require('lodash');
var IntegrationInformationsGetter = require('../../services/integration-informations-getter');
var MixpanelEventsGetter = require('./services/mixpanel-events-getter');
var MixpanelEventsSerializer = require('./serializers/mixpanel-events');
var auth = require('../../services/auth');
var path = require('../../services/path');

module.exports = function (app, model, Implementation, opts) {
  var modelName = Implementation.getModelName(model);
  var integrationInfo;

  if (opts.integrations && opts.integrations.mixpanel) {
    integrationInfo = new IntegrationInformationsGetter(modelName,
      Implementation, opts.integrations.mixpanel).perform();
  }

  this.mixpanelEvents = function (request, response, next) {
    new MixpanelEventsGetter(Implementation, _.extend(request.query,
      request.params), opts, integrationInfo)
      .perform()
      .spread(function (count, events) {
        return new MixpanelEventsSerializer(events, modelName, { count: count });
      })
      .then(function (events) { response.send(events); })
      .catch(next);
  };

  this.perform = function () {
    app.get(path.generate(modelName + '/:recordId/relationships/mixpanel_events_this_week', opts),
      auth.ensureAuthenticated, this.mixpanelEvents);
  };
};
