
const logger = require('../../../services/logger');

function ConversationGetter(Implementation, params, opts) {
  const Intercom = opts.integrations.intercom.intercom;
  let intercom;

  intercom = new Intercom.Client(opts.integrations.intercom.credentials).usePromises();

  this.perform = function () {
    return intercom.conversations
      .find({ id: params.conversationId })
      .then(response => response.body)
      .catch((error) => {
        logger.error('Cannot retrieve the Intercom conversation for the following reason:', error);
        return null;
      });
  };
}

module.exports = ConversationGetter;
