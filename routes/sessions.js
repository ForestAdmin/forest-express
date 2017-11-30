'use strict';
/* jshint sub: true */
var _ = require('lodash');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var SuperAgent = require('superagent');
var path = require('../services/path');
var AllowedUsersFinder = require('../services/allowed-users-finder');

module.exports = function (app, opts) {

  function login(request, response) {
    new AllowedUsersFinder(request.body.renderingId, opts)
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
        var forestUrl = process.env.FOREST_URL ||
          'https://forestadmin-server.herokuapp.com';

        SuperAgent
          .get(forestUrl + '/api/environment/' + opts.envSecret + '/authExpirationAt')
          .end(function(error, result) {
            var token = jwt.sign({
              id: user.id,
              type: 'users',
              data: {
                email: user.email,
                'first_name': user['first_name'],
                'last_name': user['last_name'],
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
              expiresIn: result.body.authExpirationTime || '14 days'
            });

            response.send({ token: token });
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

  this.perform = function () {
    app.post(path.generate('sessions', opts), login);
  };
};
