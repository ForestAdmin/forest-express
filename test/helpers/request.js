const request = require('supertest');
const nock = require('nock');
const forestUrlGetter = require('../../src/utils/forest-url-getter');

const urlService = forestUrlGetter();

nock(urlService)
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

module.exports = request;
