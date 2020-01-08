const cors = require('cors');
const path = require('../services/path');

module.exports = function HealthCheck(app, opts) {
  this.perform = () => {
    app.get(path.generate('healthcheck', opts), cors(), (request, response) => {
      response.status(200).send();
    });
  };
};
