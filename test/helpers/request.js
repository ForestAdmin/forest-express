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

module.exports = { init, request };
