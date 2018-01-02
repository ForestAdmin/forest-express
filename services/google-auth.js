'use strict';
var P = require('bluebird');
var request = require('superagent');
var logger = require('./logger');

function CheckGoogleAuthAndGetUser(renderingId, accessToken, envSecret) {
  this.perform = function () {
    return new P(function (resolve, reject) {
      var forestUrl = process.env.FOREST_URL ||
        'https://api.forestadmin.com';

      request
        .get(forestUrl + '/forest/renderings/' + renderingId + '/google-authorization')
        .set('forest-secret-key', envSecret)
        .set('google-access-token', accessToken)
        .end(function (error, result) {
          if (result.status === 200 && result.body && result.body.data) {
            resolve(result.body.data);
          } else {
            if (result.status === 0) {
              logger.error('Cannot retrieve the user for the project ' +
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
              logger.error(
                'Cannot retrieve the user for the project ' +
                'you\'re trying to unlock. An error occured in Forest API.',
                error
              );
            }
            reject();
          }
        });
    });
  };
}

module.exports = CheckGoogleAuthAndGetUser;
