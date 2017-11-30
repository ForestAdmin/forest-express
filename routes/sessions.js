'use strict';
/* jshint sub: true */
var jwt = require('jsonwebtoken');
var moment = require('moment');
var path = require('../services/path');
var UserAuthenticator = require('../services/user-authenticator');
var VerifyRefreshToken = require('../services/verify-refresh-token');

module.exports = function (app, opts) {
  function refreshAccessToken(request, response) {
    var requestRefreshToken = jwt.verify(request.body.refreshToken, opts.authSecret).token;
    var decodedToken = JSON.parse(Buffer
      .from(request.body.token.split('.')[1], 'base64').toString());
    var lastSession = decodedToken.data.maximumInactive;

    if (moment(lastSession).isBefore(moment())) {
      return response.status(401).send();
    }

    new VerifyRefreshToken(opts, request.body, requestRefreshToken)
      .perform()
      .then(function (result) {
        if (result.status !== 204) {
          response.sendStatus(400);
          return null;
        }
        return new UserAuthenticator(request, opts, true)
          .perform()
          .then(function (tokens) { response.send(tokens); })
          .catch(function (error) {
            var body;
            if (error && error.message) {
              body = { errors: [{ detail: error.message }] };
            }
            return response.status(401).send(body);
          });
      })
      .catch(function (error) {
        var body;
        if (error && error.message) {
          body = { errors: [{ detail: error.message }] };
        }
        return response.status(401).send(body);
      });
  }

  function login(request, response) {
    new UserAuthenticator(request, opts)
      .perform()
      .then(function (tokens) { response.send(tokens); })
      .catch(function (error) {
        var body;
        if (error && error.message) {
          body = { errors: [{ detail: error.message }] };
        }
        return response.status(401).send(body);
      });
  }

  this.perform = function () {
    app.post(path.generate('sessions', opts), login);
    app.post(path.generate('refreshAccessToken', opts), refreshAccessToken);
  };
};
