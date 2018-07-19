'use strict';
/* jshint sub: true */
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('../services/path');
const AllowedUsersFinder = require('../services/allowed-users-finder');
let GoogleAuthorizationFinder = require('../services/google-authorization-finder');
const ipWhitelist = require('../services/ip-whitelist');
const errorMessages = require('../utils/error-messages');

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

  function createToken(user, renderingId) {
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
      expiresIn: '14 days'
    });
  }

  function sendToken(response, renderingId) {
    return function (user) {
      const token = createToken(user, renderingId);
      response.send({ token: token });
    };
  }

  function formatAndSendError(response) {
    return function (error) {
      let body;
      if (error && error.message) {
        body = { errors: [{ detail: error.message }] };
      }
      return response.status(401).send(body);
    };
  }

  function loginWithPassword(request, response) {
    const renderingId = request.body.renderingId;
    const envSecret = opts.envSecret;

    return ipWhitelist.retrieve(envSecret)
      .then(function () { return new AllowedUsersFinder(renderingId, envSecret).perform(); })
      .then(function (allowedUsers) {
        if (allowedUsers.length === 0) {
          throw new Error(errorMessages.SESSION.NO_USERS);
        }

        const user = _.find(allowedUsers, function (allowedUser) {
          return allowedUser.email === request.body.email;
        });

        if (user === undefined) {
          throw new Error();
        }

        return bcrypt.compare(request.body.password, user.password)
          .then(function (isEqual) {
            if (!isEqual) { throw new Error(); }
            return user;
          });
      })
      .then(sendToken(response, renderingId))
      .catch(formatAndSendError(response));
  }

  function loginWithGoogle(request, response) {
    const renderingId = request.body.renderingId;
    const forestToken = request.body.forestToken;
    const envSecret = opts.envSecret;

    ipWhitelist.retrieve(envSecret)
      .then(function () {
        return new GoogleAuthorizationFinder(renderingId, forestToken, envSecret).perform();
      })
      .then(function (user) {
        if (!user) { throw new Error(); }
        return user;
      })
      .then(sendToken(response, renderingId))
      .catch(formatAndSendError(response));
  }

  this.perform = function () {
    app.post(path.generate('sessions', opts), checkAuthSecret, loginWithPassword);
    app.post(path.generate('sessions-google', opts), checkAuthSecret, loginWithGoogle);
  };
};
