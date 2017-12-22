const _ = require('lodash');
const IntegrationInformationsGetter = require('./services/integration-informations-getter');
const AttributesGetter = require('./services/attributes-getter');
const AttributesSerializer = require('./serializers/intercom-attributes');
const ConversationsGetter = require('./services/conversations-getter');
const ConversationsSerializer = require('./serializers/intercom-conversations');
const ConversationGetter = require('./services/conversation-getter');
const ConversationSerializer = require('./serializers/intercom-conversation');
const auth = require('../../services/auth');

module.exports = function routes(app, model, Implementation, opts) {
  const modelName = Implementation.getModelName(model);
  let integrationInfo;

  if (opts.integrations && opts.integrations.intercom) {
    integrationInfo = new IntegrationInformationsGetter(
      modelName,
      Implementation, opts.integrations.intercom,
    ).perform();
  }

  this.getAttributes = function getAttributes(request, response, next) {
    new AttributesGetter(
      Implementation, _.extend(request.query, request.params), opts,
      integrationInfo,
    )
      .perform()
      .then(attributes => new AttributesSerializer(attributes, modelName))
      .then((attributes) => {
        response.send(attributes);
      })
      .catch(next);
  };

  this.listConversations = function listConversations(request, response, next) {
    new ConversationsGetter(
      Implementation, _.extend(request.query, request.params), opts,
      integrationInfo,
    )
      .perform()
      .spread((count, conversations) => new ConversationsSerializer(
        conversations, modelName,
        { count },
      ))
      .then((conversations) => {
        response.send(conversations);
      })
      .catch(next);
  };

  this.getConversation = function getConversation(request, response, next) {
    new ConversationGetter(Implementation, _.extend(request.query, request.params), opts)
      .perform()
      .then(conversation => new ConversationSerializer(conversation, modelName))
      .then((conversation) => {
        response.send(conversation);
      })
      .catch(next);
  };

  this.perform = function perform() {
    if (integrationInfo) {
      app.get(
        `/forest/${modelName}/:recordId/intercom_attributes`,
        auth.ensureAuthenticated, this.getAttributes,
      );
      app.get(
        `/forest/${modelName}/:recordId/intercom_conversations`,
        auth.ensureAuthenticated, this.listConversations,
      );
      app.get(
        `/forest/${modelName}_intercom_conversations/:conversationId`,
        auth.ensureAuthenticated, this.getConversation,
      );
    }
  };
};
