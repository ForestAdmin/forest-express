'use strict';
var P = require('bluebird');
var request = require('superagent');
var allowedUsers = require('./auth').allowedUsers;
var logger = require('./logger');
var errorMessages = require('../utils/error-messages');

function AllowedUsersFinder(renderingId, opts) {
  this.perform = function () {
    return new P(function (resolve) {
      request
        .get(opts.forestUrl + '/forest/renderings/' + renderingId + '/allowed-users')
        .set('forest-secret-key', opts.envSecret)
        .end(function (error, result) {
          allowedUsers = [];
          if (result.status === 200 && result.body && result.body.data) {
            result.body.data.forEach(function (userData) {
              var user = userData.attributes;
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
