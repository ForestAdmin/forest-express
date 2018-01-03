'use strict';
/* jshint sub: true */
var _ = require('lodash');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var path = require('../services/path');
var AllowedUsersFinder = require('../services/allowed-users-finder');
var GoogleAuthorizationFinder = require('../services/google-authorization-finder');
var P = require('bluebird');

module.exports = function (app, opts, dependencies) {
  if (dependencies.GoogleAuthorizationFinder) {
    GoogleAuthorizationFinder = dependencies.GoogleAuthorizationFinder;
  }

  function createToken(user, renderingId) {
    var token = jwt.sign({
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

    return token;
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

  function loginWithPassword(request, response) {
    var renderingId = request.body.renderingId;

    new AllowedUsersFinder(renderingId, opts)
      .perform()
      .then(function (allowedUsers) {
        if (!opts.authSecret) {
          throw new Error('Your Forest authSecret seems to be missing. Can ' +
            'you check that you properly set a Forest authSecret in the ' +
            'Forest initializer?');
        }

        if (allowedUsers.length === 0) {
          throw new Error('Forest cannot retrieve any users for the project ' +
            'you\'re trying to unlock.');
        }

        var user = _.find(allowedUsers, function (allowedUser) {
          return allowedUser.email === request.body.email;
        });

        if (user === undefined) {
          throw new Error();
        }

        return bcrypt.compare(request.body.password, user.password)
          .then(function (isEqual) {
            if (!isEqual) {
              throw new Error();
            }

            return user;
          });
      })
      .then(function (user) {
        var token = createToken(user, renderingId);
        response.send({ token: token });
      })
      .catch(formatAndSendError(response));
  }

  function loginWithGoogle(request, response) {
    var renderingId = request.body.renderingId;
    var envSecret = opts.envSecret;
    var googleAccessToken = request.body.accessToken;

    P.try(function () {
      if (!opts.authSecret) {
        throw new Error('Your Forest authSecret seems to be missing. Can ' +
          'you check that you properly set a Forest authSecret in the ' +
          'Forest initializer?');
      }

      return new GoogleAuthorizationFinder(renderingId, googleAccessToken, envSecret).perform();
    })
      .then(function (user) {
        if (!user) {
          throw new Error();
        }

        var token = createToken(user, renderingId);
        response.send({ token: token });
      })
      .catch(formatAndSendError(response));
  }

  this.perform = function () {
    app.post(path.generate('sessions', opts), loginWithPassword);
    app.post(path.generate('sessions-google', opts), loginWithGoogle);
  };
};
