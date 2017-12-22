
/* jshint sub: true */
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('../services/path');
const AllowedUsersFinder = require('../services/allowed-users-finder');

module.exports = function (app, opts) {
  function login(request, response) {
    new AllowedUsersFinder(request.body.renderingId, opts)
      .perform()
      .then((allowedUsers) => {
        if (!opts.authSecret) {
          throw new Error('Your Forest authSecret seems to be missing. Can ' +
            'you check that you properly set a Forest authSecret in the ' +
            'Forest initializer?');
        }

        if (allowedUsers.length === 0) {
          throw new Error('Forest cannot retrieve any users for the project ' +
            'you\'re trying to unlock.');
        }

        const user = _.find(allowedUsers, allowedUser => allowedUser.email === request.body.email);

        if (user === undefined) {
          throw new Error();
        }

        return bcrypt.compare(request.body.password, user.password)
          .then((isEqual) => {
            if (!isEqual) {
              throw new Error();
            }

            return user;
          });
      })
      .then((user) => {
        const token = jwt.sign({
          id: user.id,
          type: 'users',
          data: {
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            teams: user.teams,
          },
          relationships: {
            renderings: {
              data: [{
                type: 'renderings',
                id: request.body.renderingId,
              }],
            },
          },
        }, opts.authSecret, {
          expiresIn: '14 days',
        });

        response.send({ token });
      })
      .catch((error) => {
        let body;
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
