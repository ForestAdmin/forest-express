const path = require('../services/path');

module.exports = function Forest(app, options) {
  this.perform = () => {
    app.get(path.generate('', options), (request, response) => {
      response.status(204).send();
    });
  };
};
