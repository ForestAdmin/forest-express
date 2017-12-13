'use strict';
/* jshint sub: true */
var P = require('bluebird');
var jwt = require('jsonwebtoken');
var path = require('../services/path');
var CheckGoogleAuthAndGetUser = require('../services/google-auth');

module.exports = function (app, opts, dependencies) {
  if (dependencies.CheckGoogleAuthAndGetUser) {
    CheckGoogleAuthAndGetUser = dependencies.CheckGoogleAuthAndGetUser;
  }

  function login(request, response) {
    var renderingId = request.body.renderingId;
    var envSecret = opts.envSecret;
    var googleAccessToken = request.body.accessToken;

    P.resolve()
      .then(function () {
        if (!opts.authSecret) {
          throw new Error('Your Forest authSecret seems to be missing. Can ' +
            'you check that you properly set a Forest authSecret in the ' +
            'Forest initializer?');
        }
      })
      .then(function () {
        return new CheckGoogleAuthAndGetUser(
          renderingId,
          googleAccessToken,
          envSecret
        ).perform();
      })
      .then(function (user) {
        if (!user) {
          throw new Error();
        }

        return user;
      })
      .then(function (user) {
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
                id: request.body.renderingId
              }]
            }
          }
        }, opts.authSecret, {
          expiresIn: '14 days'
        });

        response.send({ token: token });
      })
      .catch(function (error) {
        var body;
        if (error && error.message) {
          body = { errors: [{ detail: error.message }] };
        }
        return response.status(401).send(body);
      });
  }

  this.perform = function () {
    app.post(path.generate('sessions-google', opts), login);
  };
};
