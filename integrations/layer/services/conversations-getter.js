'use strict';
var P = require('bluebird');
var request = require('superagent');

function ConversationsGetter(Implementation, params, opts, integrationInfo) {
  var collectionModel = null;

  function getConversations(user) {
    return new P(function (resolve, reject) {
      if (!user) { return resolve([0, []]); }

      return request
        .get('https://api.layer.com/apps/' + opts.integrations.layer.appId +
          '/users/' + user + '/conversations')
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
    var collectionFieldName = integrationInfo.field;
    collectionModel = integrationInfo.collection;

    return Implementation.Layer.getUser(collectionModel,
      collectionFieldName, params.recordId)
      .then(function (user) {
        return getConversations(user[collectionFieldName])
          .spread(function (count, conversations) {
            return [count, conversations];
          })
          .catch(function () {
            return [0, []];
          });
      });
  };
}

module.exports = ConversationsGetter;
