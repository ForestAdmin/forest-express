const _ = require('lodash');
const P = require('bluebird');
const logger = require('../../../services/logger');

function ConversationsGetter(Implementation, params, opts, collectionName) {
  let model = null;
  const Intercom = opts.integrations.intercom.intercom;
  let intercom;

  if (opts.integrations.intercom.credentials) {
    intercom = new Intercom.Client(opts.integrations.intercom.credentials)
      .usePromises();
  } else {
    // TODO: Remove once appId/apiKey is not supported anymore.
    intercom = new Intercom.Client(
      opts.integrations.intercom.appId,
      opts.integrations.intercom.apiKey,
    ).usePromises();
  }

  function hasPagination() {
    return params.page && params.page.number;
  }

  function getLimit() {
    return 5;
  }

  function getSkip() {
    if (hasPagination()) {
      return (parseInt(params.page.number, 10) - 1) * getLimit();
    }
    return 0;
  }

  function getLink(conversation) {
    return `https://api.intercom.io/conversations/${conversation.id}`;
  }


  function fetchPages(pages, conversations) {
    return intercom
      .nextPage(pages)
      .then((response) => {
        conversations = conversations.concat(response.body.conversations);

        if (response.body.pages.next) {
          return fetchPages(response.pages);
        }
        return conversations;
      });
  }

  this.perform = () => {
    model = Implementation.getModels()[collectionName];

    return Implementation.Intercom.getCustomer(model, params.recordId)
      .then((customer) => intercom.conversations
        .list({
          email: customer.email,
          type: 'user',
          display_as: 'plaintext',
        })
        .then((response) => {
          const { conversations } = response.body;

          if (response.body.pages.next) {
            return fetchPages(response.body.pages, conversations);
          }
          return conversations;
        })
        .then((conversations) => [conversations.length,
          conversations.slice(getSkip(), getSkip() + getLimit())])
        .spread((count, conversations) => intercom.admins.list()
          .then((response) => {
            const { admins } = response.body;

            return P
              .map(conversations, (conversation) => {
                if (conversation.assignee.type === 'admin') {
                  const adminId = parseInt(conversation.assignee.id, 10);
                  const admin = _.find(admins, { id: adminId });

                  conversation.assignee = admin;
                }

                if (opts.integrations.intercom.apiKey) {
                  conversation.link = getLink(conversation);
                }

                return conversation;
              })
              .then((conversationsFormatted) => [count, conversationsFormatted]);
          }))
        .catch((error) => {
          try {
            logger.error(`Cannot access to Intercom conversations: ${error.body.errors[0].message}`);
          } catch (tryError) {
            logger.error('Cannot access to Intercom conversations: ', error);
          }
          return [0, []];
        }));
  };
}

module.exports = ConversationsGetter;
