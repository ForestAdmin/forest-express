'use strict';
var P = require('bluebird');
var request = require('superagent');
var allowedUsers = require('./auth').allowedUsers;

function AllowedUsersFinder(renderingId, opts) {
  this.perform = function () {
    return new P(function (resolve, reject) {
      var forestUrl = process.env.FOREST_URL ||
        'https://forestadmin-server.herokuapp.com';

      request
        .get(forestUrl + '/forest/renderings/' + renderingId +
          '/allowed-users')
        .set('forest-secret-key', opts.secretKey)
        .end(function (err, res) {
          if (err) { return reject(err); }
          if (res.status !== 200) {
            return reject(res.status);
          }

          allowedUsers = [];
          res.body.data.forEach(function (d) {
            var user = d.attributes;
            user.id = d.id;

            allowedUsers.push(user);
          });

          resolve(allowedUsers);
        });

    });
  };
}

module.exports = AllowedUsersFinder;
