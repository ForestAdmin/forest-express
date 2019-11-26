const P = require('bluebird');
const request = require('superagent');

function MessagesGetter(Implementation, params, opts) {
  function getMessages() {
    return new P(((resolve, reject) => request
      .get(`https://api.layer.com/apps/${opts.integrations.layer.appId
      }/conversations/${params.conversationId}/messages`)
      .set('Accept', 'application/vnd.layer+json; version=2.0')
      .set('Content-type', 'application/json')
      .set('Authorization', `Bearer ${
        opts.integrations.layer.serverApiToken}`)
      .end((error, data) => {
        if (error) { return reject(error); }
        return resolve([data.body.length, data.body]);
      })));
  }

  this.perform = () => getMessages();
}

module.exports = MessagesGetter;
