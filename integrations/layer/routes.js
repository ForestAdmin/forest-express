'use strict';
var P = require('bluebird');
var auth = require('../../services/auth');
var superagent = require('superagent');
var ConversationsSerializer = require('./serializers/conversations');
var ConversationSerializer = require('./serializers/conversation');
var MessagesSerializer = require('./serializers/messages');

/* jshint camelcase: false */

module.exports = function (app, Implementation, opts) {
  function getNonce() {
    return new P(function (resolve, reject) {
      return superagent
        .post('https://api.layer.com/nonces')
        .set('Accept', 'application/vnd.layer+json; version=2.0')
        .set('Content-type', 'application/json')
        .end(function (err, data) {
          if (err) { return reject(err); }
          return resolve(data.body.nonce);
        });
    });
  }

  function getIdentityToken(nonce) {
    return new P(function (resolve, reject) {
      return superagent
        .post(opts.integrations.layer.identityEndpoint)
        .send({
          email: opts.integrations.layer.adminEmail,
          password: opts.integrations.layer.adminPassword,
          nonce: nonce
        })
        .end(function (error, data) {
          if (error) { return reject(error); }
          return resolve(data.body.identity_token);
        });
    });
  }

  function getSessionToken(identityToken) {
    return new P(function (resolve, reject) {
      return superagent
        .post('https://api.layer.com/sessions')
        .set('Accept', 'application/vnd.layer+json; version=2.0')
        .set('Content-type', 'application/json')
        .send({
          identity_token: identityToken,
          app_id: opts.integrations.layer.appId
        })
        .end(function (error, data) {
          if (error) { return reject(error); }
          return resolve(data.body.session_token);
        });
    });
  }

  function layerAuthentication(request, response, next) {
    getNonce()
      .then(function (nonce) {
        return getIdentityToken(nonce);
      })
      .then(function (identityToken) {
        return getSessionToken(identityToken);
      })
      .then(function (sessionToken) {
        request.layerSessionToken = sessionToken;
        next();
      })
      .catch(next);
  }

  function getConversationInfo(conversation) {
    var lastSender = null;
    var lastContent = null;
    var lastSentAt = null;

    if (conversation.last_message) {
      lastSender = conversation.last_message.sender.display_name;
      lastContent = conversation.last_message.parts[0].body;
      lastSentAt = conversation.last_message.sent_at;
    }

    return {
      id: conversation.id.replace('layer:///conversations/', ''),
      sender: lastSender,
      lastMessageContent: lastContent,
      lastMessageSentAt: lastSentAt
    };
  }

  this.conversations = function (request, response, next) {
    return new P(function (resolve, reject) {
      return superagent
        .get('https://api.layer.com/conversations')
        .set('Accept', 'application/vnd.layer+json; version=2.0')
        .set('Content-type', 'application/json')
        .set('Authorization', 'Layer session-token="' +
          request.layerSessionToken + '"')
        .end(function (error, data) {
          if (error) { return reject(error); }
          return resolve(data);
        });
    }).then(function (data) {
      return P
        .map(data.body, function (conversation) {
          return getConversationInfo(conversation);
        })
        .then(function (conversations) {
          return new ConversationsSerializer(conversations, {
            count: data.headers['layer-count']
          });
        });
    }).then(function (conversations) {
      response.send(conversations);
    })
    .catch(next);
  };

  this.conversation = function (request, response, next) {
    return new P(function (resolve, reject) {
      return superagent
        .get('https://api.layer.com/conversations/' +
          request.params.conversationId)
        .set('Accept', 'application/vnd.layer+json; version=2.0')
        .set('Content-type', 'application/json')
        .set('Authorization', 'Layer session-token="' +
          request.layerSessionToken + '"')
        .end(function (error, data) {
          if (error) { return reject(error); }
          return resolve(data);
        });
    }).then(function (data) {
      return getConversationInfo(data.body);
    }).then(function (conversation) {
      return new ConversationSerializer(conversation);
    })
    .then(function (conversation) {
      response.send(conversation);
    })
    .catch(next);
  };

  this.messages = function (request, response, next) {
    return new P(function (resolve, reject) {
      return superagent
        .get('https://api.layer.com/conversations/' +
          request.params.conversationId + '/messages')
        .set('Accept', 'application/vnd.layer+json; version=2.0')
        .set('Content-type', 'application/json')
        .set('Authorization', 'Layer session-token="' +
          request.layerSessionToken + '"')
        .end(function (error, data) {
          if (error) { return reject(error); }
          return resolve(data);
        });
    }).then(function (data) {
      return P
        .map(data.body, function (message) {
          return {
            id: message.id.replace('layer:///messages/', ''),
            sender: message.sender.display_name,
            senderAvatar: message.sender.avatar_url,
            sentAt: message.sent_at,
            content: message.parts[0].body,
            mimeType: message.parts[0].mime_type
          };
        })
        .then(function (messages) {
          return new MessagesSerializer(messages, {
            count: data.headers['layer-count']
          });
        });
    })
    .then(function (messages) {
      response.send(messages);
    })
    .catch(next);
  };

  this.perform = function () {
    app.get('/forest/layer_conversations', auth.ensureAuthenticated,
      layerAuthentication, this.conversations);

    app.get('/forest/layer_conversations/:conversationId',
      auth.ensureAuthenticated, layerAuthentication, this.conversation);

    app.get('/forest/layer_conversations/:conversationId/relationships/messages',
      auth.ensureAuthenticated, layerAuthentication, this.messages);
  };
};
