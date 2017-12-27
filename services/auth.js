'use strict';
var error = require('./error');

exports.ensureAuthenticated = function (request, response, next) {
  if (request.user) {
    next();
  } else {
    return next(new error.Unauthorized('Forest cannot authenticate the user for this request.'));
  }
};

exports.allowedUsers = [];
