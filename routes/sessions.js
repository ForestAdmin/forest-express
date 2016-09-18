'use strict';
var _ = require('lodash');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var path = require('../services/path');
var AllowedUsersFinder = require('../services/allowed-users-finder');

module.exports = function (app, opts) {

  function login(req, res) {
    new AllowedUsersFinder(req.body.renderingId, opts)
      .perform()
      .then(function (allowedUsers) {
        var user = _.find(allowedUsers, function (allowedUser) {
          return allowedUser.email === req.body.email &&
            bcrypt.compareSync(req.body.password, allowedUser.password);
        });

        if (user) {
          var token = jwt.sign({
            id: user.id,
            type: 'users',
            data: {
              email: user.email,
              // jshint sub: true
              'first_name': user['first_name'],
              'last_name': user['last_name'],
              teams: user.teams
            },
            relationships: {
              outlines: {
                data: [{
                  type: 'outlines',
                  id: req.body.outlineId
                }]
              }
            }
          }, opts.authKey, {
            expiresIn: '14 days'
          });

          res.send({ token: token });
        } else {
          res.status(401).send();
        }
      });
  }

  this.perform = function () {
    app.post(path.generate('/sessions', opts), login);
  };
};


