const fs = require('fs');
const moment = require('moment');

const superagentRequest = require('superagent');
const path = require('path');
const openIdClient = require('openid-client');
const jsonwebtoken = require('jsonwebtoken');

module.exports = (context) =>
  context.addInstance('superagentRequest', () => superagentRequest)
    .addInstance('fs', () => fs)
    .addInstance('path', path)
    .addInstance('openIdClient', () => openIdClient)
    .addInstance('jsonwebtoken', () => jsonwebtoken)
    .addInstance('moment', () => moment);
