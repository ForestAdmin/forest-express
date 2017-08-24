'use strict';
var P = require('bluebird');
var request = require('superagent');

function ConversationGetter(Implementation, params, opts) {

  function getConversation() {
    return new P(function (resolve, reject) {
      return request
        .get('https://api.layer.com/apps/' + opts.integrations.layer.appId +
          '/conversations/' + params.conversationId)
        .set('Accept', 'application/vnd.layer+json; version=2.0')
        .set('Content-type', 'application/json')
        .set('Authorization', 'Bearer ' + opts.integrations.layer.serverApiToken)
        .end(function (error, data) {
          if (error) { return reject(error); }
          return resolve(data.body);
        });
    });
  }

  this.perform = function () {
    return getConversation();
  };
}

module.exports = ConversationGetter;
