'use strict';
var uuidV1 = require('uuid/v1');

/* jshint sub: true */
var P = require('bluebird');
var _ = require('lodash');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var path = require('../services/path');
var AllowedUsersFinder = require('../services/allowed-users-finder');
var AuthEnvironmentGetter = require('../services/auth-environment-getter');
var RefreshTokenSender = require('../services/refresh-token-sender');
var RefreshTokenVerify = require('../services/refresh-token-verify');
var GoogleAuthorizationFinder = require('../services/google-authorization-finder');
var errorMessages = require('../utils/error-messages');

module.exports = function (app, opts, dependencies) {
  if (dependencies.GoogleAuthorizationFinder) {
    GoogleAuthorizationFinder = dependencies.GoogleAuthorizationFinder;
  }

  function checkAuthSecret(request, response, next) {
    if (!opts.authSecret) {
      return response.status(401)
        .send({ errors: [{ detail: errorMessages.CONFIGURATION.AUTH_SECRET_MISSING }] });
    }
    next();
  }

  function createToken(user, renderingId, expTime) {
    return jwt.sign({
      id: user.id,
      type: 'users',
      data: {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        teams: user.teams
      },
      relationships: {
        renderings: {
          data: [{
            type: 'renderings',
            id: renderingId
          }]
        }
      }
    }, opts.authSecret, {
      expiresIn: expTime.accessTokenExpiration + ' seconds'
    });
  }

  function encodeRefreshToken(refreshToken, expTime) {
    return jwt.sign({
      refreshToken: refreshToken,
    }, opts.authSecret, {
      expiresIn: expTime.refreshTokenExpiration + ' seconds'
    });
  }

  function sendToken(response, renderingId, user) {
    return function (expTime) {
      var refreshToken = uuidV1();
      var token = createToken(user, renderingId, expTime);
      var encodedRefreshToken = encodeRefreshToken(refreshToken, expTime);
      response.send({ token: token, refreshToken: encodedRefreshToken });
      return refreshToken;
    };
  }

  function formatAndSendError(response) {
    return function (error) {
      var body;
      if (error && error.message) {
        body = { errors: [{ detail: error.message }] };
      }
      return response.status(401).send(body);
    };
  }

  function loginWithPassword(request, response, isRefresh) {
    var renderingId = request.body.renderingId;
    new AllowedUsersFinder(renderingId, opts)
      .perform()
      .then(function (allowedUsers) {
        if (allowedUsers.length === 0) {
          throw new Error(errorMessages.SESSION.NO_USERS);
        }

        var user = _.find(allowedUsers, function (allowedUser) {
          return allowedUser.email === request.body.email;
        });

        if (user === undefined) {
          throw new Error();
        }

        if (isRefresh === true) { return user; }

        return bcrypt.compare(request.body.password, user.password)
          .then(function (isEqual) {
            if (!isEqual) { throw new Error(); }
            return user;
          });
      })
      .then(function (user) {
        return new AuthEnvironmentGetter(opts)
          .perform()
          .then(sendToken(response, renderingId, user))
          .then(function(refreshToken) {
            return new RefreshTokenSender(opts, refreshToken, renderingId, user.id)
              .perform();
          });
      })
      .catch(formatAndSendError(response));
  }

  function loginWithGoogle(request, response) {
    var renderingId = request.body.renderingId;
    var forestToken = request.body.forestToken;

    P.try(function () {
      return new GoogleAuthorizationFinder(renderingId, forestToken, opts).perform();
    })
      .then(function (user) {
        if (!user) { throw new Error(); }
        return user;
      })
      .then(sendToken(response, renderingId))
      .catch(formatAndSendError(response));
  }

  function refreshAccessToken(request, response) {
    if (!request.body.refreshToken || !request.body.renderingId ||
      !request.body.userId || !request.body.email) {
      response.sendStatus(403);
      return null;
    }
    return new RefreshTokenVerify(opts,
      request.body.refreshToken,
      request.body.renderingId,
      request.body.userId)
      .perform()
      .then(function () {
        return loginWithPassword(request, response, true);
      })
      .catch(function () {
        response.sendStatus(403);
      });
  }

  this.perform = function () {
    app.post(path.generate('sessions', opts), checkAuthSecret, loginWithPassword);
    app.post(path.generate('sessions-refresh', opts), checkAuthSecret, refreshAccessToken);
    app.post(path.generate('sessions-google', opts), checkAuthSecret, loginWithGoogle);
  };
};
