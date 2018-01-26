'use strict';
var P = require('bluebird');
var request = require('superagent');
var allowedUsers = require('./auth').allowedUsers;
var logger = require('./logger');
var errorMessages = require('../utils/error-messages');

function AllowedUsersFinder(opts) {
  this.perform = function () {
    return new P(function (resolve) {
      request
        .post(opts.forestUrl + '/forest/environment/authExpirationTime')
        .send({ secretKey: opts.envSecret })
        .end(function (error, result) {
          resolve(result);
        });
    });
  };
}

module.exports = AllowedUsersFinder;
