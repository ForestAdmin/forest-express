const path = require('../services/path');

module.exports = function (app, options) {
  this.perform = function () {
    app.get(path.generate('', options), (request, response) => {
      response.status(204).send();
    });
  };
};
