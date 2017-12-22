
const error = require('./error');

exports.ensureAuthenticated = function (req, res, next) {
  if (req.user) {
    next();
  } else {
    return next(new error.Unauthorized('Forest cannot authenticate the user for this request.'));
  }
};

exports.allowedUsers = [];
