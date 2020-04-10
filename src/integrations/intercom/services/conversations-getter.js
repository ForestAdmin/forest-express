const _ = require('lodash');
const P = require('bluebird');
const logger = require('../../../services/logger');
const ContactGetter = require('./contact-getter');

function ConversationsGetter(Implementation, params, opts, mappingValue) {
  const Intercom = opts.integrations.intercom.intercom;
  const intercom = new Intercom.Client(opts.integrations.intercom.credentials);

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

  // NOTICE: Forcing the usage of bluebird to avoid issues with the spread on route file
  this.perform = () => P.resolve(
    ContactGetter
      .getContact(intercom, Implementation, mappingValue, params.recordId)
      .then((contact) => {
        if (!contact.body.data) {
          throw new Error('No intercom contact matches the given key');
        }
        return intercom.conversations
          .list({
            email: contact.body.data[0].email,
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
                  if (conversation.assignee && conversation.assignee.type === 'admin') {
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
          });
      }),
  );
}

module.exports = ConversationsGetter;
