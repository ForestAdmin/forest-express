'use strict';
var P = require('bluebird');
var request = require('superagent');

function AllowedUsersFinder(opts) {
  this.perform = function () {
    return new P(function (resolve) {
      request
        .post(opts.forestUrl + '/forest/environment/authExpirationTime')
        .send({ secretKey: opts.envSecret })
        .end(function (error, result) {
          resolve(result.body);
        });
    });
  };
}

module.exports = AllowedUsersFinder;
