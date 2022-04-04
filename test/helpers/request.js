const { inject } = require('@forestadmin/context');
const request = require('supertest');
const nock = require('nock');

function init() {
  const { forestUrl } = inject();

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
