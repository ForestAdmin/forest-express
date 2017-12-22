const P = require('bluebird');
const request = require('superagent');

function ConversationsGetter(Implementation, params, opts, integrationInfo) {
  let collectionModel = null;

  function getConversations(user) {
    return new P(((resolve, reject) => {
      if (!user) { return resolve([0, []]); }

      return request
        .get(`https://api.layer.com/apps/${opts.integrations.layer.appId
        }/users/${user}/conversations`)
        .set('Accept', 'application/vnd.layer+json; version=2.0')
        .set('Content-type', 'application/json')
        .set('Authorization', `Bearer ${
          opts.integrations.layer.serverApiToken}`)
        .end((error, data) => {
          if (error) { return reject(error); }
          return resolve([data.body.length, data.body]);
        });
    }));
  }

  this.perform = function perform() {
    const collectionFieldName = integrationInfo.field;
    collectionModel = integrationInfo.collection;

    return Implementation.Layer.getUser(
      collectionModel,
      collectionFieldName, params.recordId,
    )
      .then(user => getConversations(user[collectionFieldName])
        .spread((count, conversations) => [count, conversations])
        .catch(() => [0, []]));
  };
}

module.exports = ConversationsGetter;
