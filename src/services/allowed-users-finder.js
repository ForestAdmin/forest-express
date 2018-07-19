const P = require('bluebird');
const request = require('superagent');
const ServiceUrlGetter = require('./service-url-getter');
var allowedUsers = require('./auth').allowedUsers;
const logger = require('./logger');
const errorMessages = require('../utils/error-messages');

function AllowedUsersFinder(renderingId, environmentSecret) {
  this.perform = function () {
    return new P(function (resolve) {
      const urlService = new ServiceUrlGetter().perform();

      request
        .get(urlService + '/forest/renderings/' + renderingId + '/allowed-users')
        .set('forest-secret-key', environmentSecret)
        .end(function (error, result) {
          allowedUsers = [];
          if (result.status === 200 && result.body && result.body.data) {
            result.body.data.forEach(function (userData) {
              const user = userData.attributes;
              user.id = userData.id;
              allowedUsers.push(user);
            });
          } else {
            if (result.status === 0) {
              logger.error(errorMessages.SESSION.SERVER_DOWN);
            } else if (result.status === 404) {
              logger.error(errorMessages.SESSION.SECRET_NOT_FOUND);
            } else if (result.status === 422) {
              logger.error(errorMessages.SESSION.SECRET_AND_RENDERINGID_INCONSISTENT);
            } else {
              logger.error(errorMessages.SESSION.UNEXPECTED, error);
            }
          }
          resolve(allowedUsers);
        });
    });
  };
}

module.exports = AllowedUsersFinder;
