
const path = require('../services/path');

module.exports = function (app, opts) {
  this.perform = function () {
    app.get(path.generate('', opts), (req, res) => {
      res.status(204).send();
    });
  };
};
