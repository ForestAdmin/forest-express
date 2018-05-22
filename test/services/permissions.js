const PermissionsChecker= require('../../src/services/permissions-checker');
const nock = require('nock');
const ServiceUrlGetter = require('../../src/services/service-url-getter');

describe('Service > Permissions', () => {
  const urlService = new ServiceUrlGetter().perform();
  const nockObj = nock(urlService);

  describe('with some good permissions data', () => {
    describe('with the "list" permission', () => {
      before(() => {
        PermissionsChecker.cleanCache();
        nockObj.get('/liana/v1/permissions')
          .reply(200, {
            Users: {
              permissions: {
                list: true,
              },
            },
          });
      });

      it('should return a resolved promise', (done) => {
        new PermissionsChecker('envSecret', 'Users', 'list')
          .perform()
          .then(done)
          .catch(done);
      });
    });

    describe('without the "list" permission', () => {
      before(() => {
        PermissionsChecker.cleanCache();
        nockObj.get('/liana/v1/permissions')
          .reply(200, {
            Users: {
              permissions: {
                list: false,
              },
            },
          });
      });

      it('should return a rejected promise', (done) => {
        new PermissionsChecker('envSecret', 'Users', 'list')
          .perform()
          .then(() => done(new Error('fail')))
          .catch(() => done());
      });
    });
  });

  describe('with some bad permissions data', () => {
    before(() => {
      PermissionsChecker.cleanCache();
      nockObj.get('/liana/v1/permissions')
        .reply(200, {});
    });

    it('should return a rejected promise', (done) => {
      new PermissionsChecker('envSecret', 'Users', 'list')
        .perform()
        .then(() => done(new Error('fail')))
        .catch(() => done());
    });
  });
});
