
const P = require('bluebird');
const request = require('superagent');
const ServiceUrlGetter = require('./service-url-getter');
let allowedUsers = require('./auth').allowedUsers;
const logger = require('./logger');

function AllowedUsersFinder(renderingId, opts) {
  this.perform = function () {
    return new P(((resolve) => {
      const urlService = new ServiceUrlGetter().perform();

      request
        .get(`${urlService}/forest/renderings/${renderingId}/allowed-users`)
        .set('forest-secret-key', opts.envSecret)
        .end((error, result) => {
          allowedUsers = [];
          if (result.status === 200 && result.body && result.body.data) {
            result.body.data.forEach((userData) => {
              const user = userData.attributes;
              user.id = userData.id;
              allowedUsers.push(user);
            });
          } else if (result.status === 0) {
            logger.error('Cannot retrieve any users for the project ' +
                'you\'re trying to unlock. Forest API seems to be down right ' +
                'now.');
          } else if (result.status === 404) {
            logger.error('Cannot retrieve the project you\'re trying to ' +
                'unlock. Can you check that you properly copied the Forest ' +
                'envSecret in the forest_liana initializer?');
          } else if (result.status === 422) {
            logger.error('Cannot retrieve the project you\'re trying to ' +
                'unlock. The envSecret and renderingId seems to be missing or inconsistent.');
          } else {
            logger.error('Cannot retrieve any users for the project ' +
                'you\'re trying to unlock. An error occured in Forest API.', error);
          }
          resolve(allowedUsers);
        });
    }));
  };
}

module.exports = AllowedUsersFinder;
