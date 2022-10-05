const { inject } = require('@forestadmin/context');
const _ = require('lodash');
const IntegrationInformationsGetter = require('../../services/integration-informations-getter');
const path = require('../../services/path');
const auth = require('../../services/auth');
const ConversationsGetter = require('./services/conversations-getter');
const serializeConversations = require('./serializers/conversations');
const ConversationGetter = require('./services/conversation-getter');
const MessagesGetter = require('./services/messages-getter');
const serializeMessages = require('./serializers/messages');

/* jshint camelcase: false */

module.exports = function Routes(app, model, Implementation, opts) {
  const { modelsManager } = inject();
  const modelName = Implementation.getModelName(model);
  let integrationInfo;

  if (opts.integrations && opts.integrations.layer) {
    integrationInfo = new IntegrationInformationsGetter(
      modelName,
      Implementation,
      opts.integrations.layer,
    ).perform();
  }

  if (integrationInfo) {
    const integrationValues = integrationInfo.split('.');
    integrationInfo = {
      collection: modelsManager.getModels()[integrationValues[0]],
      field: integrationValues[1],
    };
  }

  this.conversations = (req, res, next) => {
    new ConversationsGetter(
      Implementation,
      _.extend(req.query, req.params),
      opts,
      integrationInfo,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const conversations = results[1];

        return serializeConversations(conversations, modelName, {
          count,
        });
      })
      .then((conversations) => {
        res.send(conversations);
      })
      .catch(next);
  };

  this.conversation = (req, res, next) => {
    new ConversationGetter(
      Implementation,
      _.extend(req.query, req.params),
      opts,
      integrationInfo,
    )
      .perform()
      .then((conversation) => serializeConversations(conversation, modelName))
      .then((conversation) => {
        res.send(conversation);
      })
      .catch(next);
  };

  this.messages = (req, res, next) => {
    new MessagesGetter(
      Implementation,
      _.extend(req.query, req.params),
      opts,
      integrationInfo,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const messages = results[1];

        return serializeMessages(messages, modelName, {
          count,
        });
      })
      .then((messages) => {
        res.send(messages);
      })
      .catch(next);
  };

  this.perform = () => {
    if (integrationInfo) {
      app.get(
        path.generate(`${modelName}/:recordId/layer_conversations`, opts),
        auth.ensureAuthenticated,
        this.conversations,
      );

      app.get(
        path.generate(`${modelName}_layer_conversations/:conversationId`, opts),
        auth.ensureAuthenticated,
        this.conversation,
      );

      app.get(
        path.generate(`${modelName}_layer_conversations/:conversationId/relationships/messages`, opts),
        auth.ensureAuthenticated,
        this.messages,
      );
    }
  };
};
