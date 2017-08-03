'use strict';
var _ = require('lodash');
var IntegrationInformationsGetter = require('../../services/integration-informations-getter');
var path = require('../../services/path');
var auth = require('../../services/auth');
var ConversationsGetter = require('./services/conversations-getter');
var ConversationsSerializer = require('./serializers/conversations');
var ConversationGetter = require('./services/conversation-getter');
var MessagesGetter = require('./services/messages-getter');
var MessagesSerializer = require('./serializers/messages');

/* jshint camelcase: false */

module.exports = function (app, model, Implementation, opts) {
  var modelName = Implementation.getModelName(model);
  var integrationInfo;

  if (opts.integrations && opts.integrations.layer) {
    integrationInfo = new IntegrationInformationsGetter(modelName,
      Implementation, opts.integrations.layer).perform();
  }

  if (integrationInfo) {
    var integrationValues = integrationInfo.split('.');
    integrationInfo = {
      collection: Implementation.getModels()[integrationValues[0]],
      field: integrationValues[1]
    };
  }

  this.conversations = function (req, res, next) {
    new ConversationsGetter(Implementation, _.extend(req.query, req.params),
      opts, integrationInfo)
      .perform()
      .then(function (results) {
        var count = results[0];
        var conversations = results[1];

        return new ConversationsSerializer(conversations, modelName, {
          count: count
        });
      })
      .then(function (conversations) {
        res.send(conversations);
      })
      .catch(next);
  };

  this.conversation = function (req, res, next) {
    new ConversationGetter(Implementation, _.extend(req.query, req.params),
      opts, integrationInfo)
      .perform()
      .then(function (conversation) {
        return new ConversationsSerializer(conversation, modelName);
      })
      .then(function (conversation) {
        res.send(conversation);
      })
      .catch(next);
  };

  this.messages = function (req, res, next) {
    new MessagesGetter(Implementation, _.extend(req.query, req.params),
      opts, integrationInfo)
      .perform()
      .then(function (results) {
        var count = results[0];
        var messages = results[1];

        return new MessagesSerializer(messages, modelName, {
          count: count
        });
      })
      .then(function (messages) {
        res.send(messages);
      })
      .catch(next);
  };

  this.perform = function () {
    if (integrationInfo) {
      app.get(path.generate(modelName + '/:recordId/layer_conversations', opts),
        auth.ensureAuthenticated, this.conversations);

      app.get(path.generate(modelName +
        '_layer_conversations/:conversationId', opts),
        auth.ensureAuthenticated, this.conversation);

      app.get(path.generate(modelName +
        '_layer_conversations/:conversationId/relationships/messages', opts),
        auth.ensureAuthenticated, this.messages);
    }
  };
};

