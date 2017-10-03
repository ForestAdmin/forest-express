'use strict';
var logger = require('../../../services/logger');

function ConversationGetter(Implementation, params, opts) {
  var Intercom = opts.integrations.intercom.intercom;
  var intercom;

  intercom = new Intercom.Client(opts.integrations.intercom.credentials).usePromises();

  this.perform = function () {
    return intercom.conversations
      .find({ id: params.conversationId })
      .then(function (response) {
        return response.body;
      })
      .catch(function (error) {
        logger.error('Cannot retrieve the Intercom conversation for the following reason:', error);
        return null;
      });
  };
}

module.exports = ConversationGetter;
