'use strict';
var P = require('bluebird');
var request = require('superagent');

function MessagesGetter(Implementation, params, opts) {

  function getMessages() {
    return new P(function (resolve, reject) {
      return request
        .get('https://api.layer.com/apps/' + opts.integrations.layer.appId +
          '/conversations/' + params.conversationId + '/messages')
        .set('Accept', 'application/vnd.layer+json; version=2.0')
        .set('Content-type', 'application/json')
        .set('Authorization', 'Bearer ' +
          opts.integrations.layer.serverApiToken)
        .end(function (error, data) {
          if (error) { return reject(error); }
          return resolve([data.body.length, data.body]);
        });
    });
  }

  this.perform = function () {
    return getMessages();
  };
}

module.exports = MessagesGetter;
