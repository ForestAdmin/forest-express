'use strict';
/* jshint sub: true */
var _ = require('lodash');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var path = require('../services/path');
var AllowedUsersFinder = require('../services/allowed-users-finder');

module.exports = function (app, opts) {

  function login(request, response) {
    new AllowedUsersFinder(request.body.renderingId, opts)
      .perform()
      .then(function (allowedUsers) {
        if (allowedUsers.length === 0) {
          return response.status(401).send({
            errors: [{
              detail: 'Forest cannot retrieve any users for the project ' +
                'you\'re trying to unlock.'
            }]
          });
        }

        var user = _.find(allowedUsers, function (allowedUser) {
          return allowedUser.email === request.body.email &&
            bcrypt.compareSync(request.body.password, allowedUser.password);
        });

        if (user) {
          if (opts.authSecret) {
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
              expiresIn: '14 days'
            });

            response.send({ token: token });
          } else {
            return response.status(401).send({
              errors: [{
                detail: 'Your Forest authSecret seems to be missing. Can you ' +
                  'check that you properly set a Forest authSecret in the ' +
                  'Forest initializer?'
              }]
            });
          }
        } else {
          response.status(401).send();
        }
      });
  }

  this.perform = function () {
    app.post(path.generate('sessions', opts), login);
  };
};
