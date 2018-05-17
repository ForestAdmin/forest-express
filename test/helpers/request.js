const request = require('supertest');
const nock = require('nock');
const ServiceUrlGetter = require('../../src/services/service-url-getter');

const urlService = new ServiceUrlGetter().perform();

nock(urlService)
  .persist()
  .get('/liana/ip-whitelist-rules')
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
