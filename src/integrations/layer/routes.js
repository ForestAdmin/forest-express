
const _ = require('lodash');
const IntegrationInformationsGetter = require('../../services/integration-informations-getter');
const path = require('../../services/path');
const auth = require('../../services/auth');
const ConversationsGetter = require('./services/conversations-getter');
const ConversationsSerializer = require('./serializers/conversations');
const ConversationGetter = require('./services/conversation-getter');
const MessagesGetter = require('./services/messages-getter');
const MessagesSerializer = require('./serializers/messages');

module.exports = function routes(app, model, Implementation, opts) {
  const modelName = Implementation.getModelName(model);
  let integrationInfo;

  if (opts.integrations && opts.integrations.layer) {
    integrationInfo = new IntegrationInformationsGetter(
      modelName,
      Implementation, opts.integrations.layer,
    ).perform();
  }

  if (integrationInfo) {
    const integrationValues = integrationInfo.split('.');
    integrationInfo = {
      collection: Implementation.getModels()[integrationValues[0]],
      field: integrationValues[1],
    };
  }

  this.conversations = function conversations(req, res, next) {
    new ConversationsGetter(
      Implementation, _.extend(req.query, req.params),
      opts, integrationInfo,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const currentConversations = results[1];

        return new ConversationsSerializer(currentConversations, modelName, {
          count,
        });
      })
      .then((currentConversations) => {
        res.send(currentConversations);
      })
      .catch(next);
  };

  this.conversation = function conversation(req, res, next) {
    new ConversationGetter(
      Implementation, _.extend(req.query, req.params),
      opts, integrationInfo,
    )
      .perform()
      .then(currentConversations => new ConversationsSerializer(currentConversations, modelName))
      .then((currentConversations) => {
        res.send(currentConversations);
      })
      .catch(next);
  };

  this.messages = function messages(req, res, next) {
    new MessagesGetter(
      Implementation, _.extend(req.query, req.params),
      opts, integrationInfo,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const currentMessages = results[1];

        return new MessagesSerializer(currentMessages, modelName, {
          count,
        });
      })
      .then((currentMessages) => {
        res.send(currentMessages);
      })
      .catch(next);
  };

  this.perform = function perform() {
    if (integrationInfo) {
      app.get(
        path.generate(`${modelName}/:recordId/layer_conversations`, opts),
        auth.ensureAuthenticated, this.conversations,
      );

      app.get(
        path.generate(`${modelName
        }_layer_conversations/:conversationId`, opts),
        auth.ensureAuthenticated, this.conversation,
      );

      app.get(
        path.generate(`${modelName
        }_layer_conversations/:conversationId/relationships/messages`, opts),
        auth.ensureAuthenticated, this.messages,
      );
    }
  };
};
