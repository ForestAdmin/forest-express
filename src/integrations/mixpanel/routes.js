const _ = require('lodash');
const IntegrationInformationsGetter = require('../../services/integration-informations-getter');
const MixpanelEventsGetter = require('./services/mixpanel-events-getter');
const MixpanelEventsSerializer = require('./serializers/mixpanel-events');
const auth = require('../../services/auth');
const path = require('../../services/path');

module.exports = function (app, model, Implementation, options) {
  const modelName = Implementation.getModelName(model);
  let integrationInfo;

  if (options.integrations && options.integrations.mixpanel) {
    integrationInfo = new IntegrationInformationsGetter(modelName,
      Implementation, options.integrations.mixpanel).perform();
  }

  if (integrationInfo) {
    const integrationValues = integrationInfo.split('.');
    integrationInfo = {
      collection: Implementation.getModels()[integrationValues[0]],
      field: integrationValues[1]
    };
  }

  this.mixpanelEvents = function (request, response, next) {
    new MixpanelEventsGetter(
      Implementation,
      _.extend(request.query, request.params),
      options,
      integrationInfo
    )
      .perform()
      .then(function (events) {
        return new MixpanelEventsSerializer(events, modelName, { }, options);
      })
      .then(function (events) { response.send(events); })
      .catch(next);
  };

  this.perform = function () {
    app.get(path.generate(`${modelName}/:recordId/relationships/mixpanel_last_events`, options),
      auth.ensureAuthenticated, this.mixpanelEvents);
  };
};
