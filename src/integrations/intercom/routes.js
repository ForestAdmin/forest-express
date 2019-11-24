const _ = require('lodash');
const IntegrationInformationsGetter = require('./services/integration-informations-getter');
const AttributesGetter = require('./services/attributes-getter');
const AttributesSerializer = require('./serializers/intercom-attributes');
const ConversationsGetter = require('./services/conversations-getter');
const ConversationsSerializer = require('./serializers/intercom-conversations');
const ConversationGetter = require('./services/conversation-getter');
const ConversationSerializer = require('./serializers/intercom-conversation');
const path = require('../../services/path');
const auth = require('../../services/auth');

module.exports = (app, model, Implementation, options) => {
  const modelName = Implementation.getModelName(model);
  let integrationInfo;

  if (options.integrations && options.integrations.intercom) {
    integrationInfo = new IntegrationInformationsGetter(
      modelName,
      Implementation, options.integrations.intercom,
    ).perform();
  }

  this.getAttributes = (request, response, next) => {
    new AttributesGetter(
      Implementation, _.extend(request.query, request.params), options,
      integrationInfo,
    )
      .perform()
      .then((attributes) => new AttributesSerializer(attributes, modelName))
      .then((attributes) => {
        response.send(attributes);
      })
      .catch(next);
  };

  this.listConversations = (request, response, next) => {
    new ConversationsGetter(
      Implementation, _.extend(request.query, request.params), options,
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

  this.getConversation = (request, response, next) => {
    new ConversationGetter(Implementation, _.extend(request.query, request.params), options)
      .perform()
      .then((conversation) => new ConversationSerializer(conversation, modelName))
      .then((conversation) => {
        response.send(conversation);
      })
      .catch(next);
  };

  this.perform = () => {
    if (integrationInfo) {
      app.get(
        path.generate(`${modelName}/:recordId/intercom_attributes`, options),
        auth.ensureAuthenticated,
        this.getAttributes,
      );
      app.get(
        path.generate(`${modelName}/:recordId/intercom_conversations`, options),
        auth.ensureAuthenticated,
        this.listConversations,
      );
      app.get(
        path.generate(`${modelName}_intercom_conversations/:conversationId`, options),
        auth.ensureAuthenticated,
        this.getConversation,
      );
    }
  };
};
