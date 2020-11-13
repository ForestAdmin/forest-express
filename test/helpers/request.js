const request = require('supertest');
const nock = require('nock');
const context = require('../../src/context');

function init() {
  const { forestUrl } = context.inject();

  nock(forestUrl)
    .persist()
    .get('/liana/v1/ip-whitelist-rules')
    .reply(200, {
      data: {
        type: 'ip-whitelist-rules',
        id: '1',
        attributes: {
          use_ip_whitelist: false,
          rules: [],
        },
      },
    });
}

function addNock(url, method, route, reqheaders = {}) {
  return nock(url, { reqheaders })[method](route);
}

function addForestNock(method, route, reqheaders = {}) {
  const { forestUrl } = context.inject();

  return addNock(forestUrl, method, route, reqheaders);
}


module.exports = {
  addNock,
  addForestNock,
  init,
  request,
};
