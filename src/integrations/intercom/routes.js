'use strict';
var _ = require('lodash');
var IntegrationInformationsGetter = require('./services/integration-informations-getter');
var AttributesGetter = require('./services/attributes-getter');
var AttributesSerializer = require('./serializers/intercom-attributes');
var ConversationsGetter = require('./services/conversations-getter');
var ConversationsSerializer = require('./serializers/intercom-conversations');
var ConversationGetter = require('./services/conversation-getter');
var ConversationSerializer = require('./serializers/intercom-conversation');
var auth = require('../../services/auth');

module.exports = function (app, model, Implementation, opts) {
  var modelName = Implementation.getModelName(model);
  var integrationInfo;

  if (opts.integrations && opts.integrations.intercom) {
    integrationInfo = new IntegrationInformationsGetter(modelName,
      Implementation, opts.integrations.intercom).perform();
  }

  this.getAttributes = function (request, response, next) {
    new AttributesGetter(Implementation, _.extend(request.query, request.params), opts,
      integrationInfo)
      .perform()
      .then(function (attributes) {
        return new AttributesSerializer(attributes, modelName);
      })
      .then(function (attributes) {
        response.send(attributes);
      })
      .catch(next);
  };

  this.listConversations = function (request, response, next) {
    new ConversationsGetter(Implementation, _.extend(request.query, request.params), opts,
      integrationInfo)
      .perform()
      .spread(function (count, conversations) {
        return new ConversationsSerializer(conversations, modelName,
          { count: count });
      })
      .then(function (conversations) {
        response.send(conversations);
      })
      .catch(next);
  };

  this.getConversation = function (request, response, next) {
    new ConversationGetter(Implementation, _.extend(request.query, request.params), opts)
      .perform()
      .then(function (conversation) {
        return new ConversationSerializer(conversation, modelName);
      })
      .then(function (conversation) {
        response.send(conversation);
      })
      .catch(next);
  };

  this.perform = function () {
    if (integrationInfo) {
      app.get('/forest/' + modelName + '/:recordId/intercom_attributes',
        auth.ensureAuthenticated, this.getAttributes);
      app.get('/forest/' + modelName + '/:recordId/intercom_conversations',
        auth.ensureAuthenticated, this.listConversations);
      app.get('/forest/' + modelName + '_intercom_conversations/:conversationId',
        auth.ensureAuthenticated, this.getConversation);
    }
  };
};
