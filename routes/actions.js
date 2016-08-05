'use strict';
var _ = require('lodash');
var auth = require('../services/auth');
var ActivityLogLogger = require('../services/activity-log-logger');

module.exports = function (app, opts) {

  function logCustomActions(request, response, next) {
    response.on('finish', function () {
      var attributes = request.body.data.attributes;
      var customAction = _.capitalize(request.path
        .replace('/forest/actions/', '').replace('-', ' '));
      var actionName = 'triggered the action "' + customAction + '"';

      _.each(attributes.ids, function (recordId) {
        new ActivityLogLogger(opts).perform(request.user, actionName,
          attributes.collection_name, recordId);
      });
    });

    return next();
  }

  this.perform = function () {
    app.use('/forest/actions', auth.ensureAuthenticated, logCustomActions);
  };
};
