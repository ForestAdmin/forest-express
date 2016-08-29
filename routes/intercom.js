'use strict';
var _ = require('lodash');
var IntegrationInformationsGetter = require('../services/integration-informations-getter');
var IntercomAttributesGetter = require('../services/intercom-attributes-getter');
var IntercomAttributesSerializer = require('../serializers/intercom-attributes');
var IntercomConversationsGetter = require('../services/intercom-conversations-getter');
var IntercomConversationsSerializer = require('../serializers/intercom-conversations');
var auth = require('../services/auth');

module.exports = function (app, model, Implementation, opts) {
  var modelName = Implementation.getModelName(model);
  var integrationInfo = new IntegrationInformationsGetter(modelName,
        Implementation, opts.integrations.intercom).perform();

  this.intercomAttributes = function (req, res, next) {
    new IntercomAttributesGetter(Implementation, _.extend(req.query,
      req.params), opts, integrationInfo)
      .perform()
      .then(function (attributes) {
        return new IntercomAttributesSerializer(attributes, modelName);
      })
      .then(function (attributes) {
        res.send(attributes);
      })
      .catch(next);
  };

  this.intercomConversations = function (req, res, next) {
    new IntercomConversationsGetter(Implementation,_.extend(req.query,
      req.params), opts, integrationInfo)
      .perform()
      .spread(function (count, conversations) {
        return new IntercomConversationsSerializer(conversations, modelName,
          { count: count });
      })
      .then(function (conversations) {
        res.send(conversations);
      })
      .catch(next);
  };

  this.perform = function () {
    if (integrationInfo) {
      app.get('/forest/' + modelName + '/:recordId/intercom_attributes',
        auth.ensureAuthenticated, this.intercomAttributes);

      app.get('/forest/' + modelName + '/:recordId/intercom_conversations',
        auth.ensureAuthenticated, this.intercomConversations);
    }
  };
};

