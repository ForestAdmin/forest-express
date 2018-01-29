'use strict';
var P = require('bluebird');
var request = require('superagent');

function RefreshTokenSender(opts, refreshToken, renderingId, userId) {
  this.perform = function () {
    return new P(function (resolve) {
      request
        .post(opts.forestUrl + '/forest/refreshTokenSetter')
        .send({
          refreshToken: refreshToken,
          renderingId: renderingId,
          userId: userId,
        })
        .end(function (error, result) {
          resolve(result || error);
        });
    });
  };
}

module.exports = RefreshTokenSender;
