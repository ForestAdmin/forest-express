'use strict';

module.exports = function (app, opts) {
  this.perform = function () {
    app.get((opts.expressMountParent ? '/' : '/forest'), function (req, res) {
      res.status(204).send();
    });
  };
};
