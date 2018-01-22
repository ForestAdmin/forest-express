'use strict';
var auth = require('../services/auth');
var path = require('../services/path');
var StatSerializer = require('../serializers/stat');

module.exports = function (app, model, Implementation, opts) {
  var modelName = Implementation.getModelName(model);

  this.get = function (request, response, next) {
    var promise = null;

    switch (request.body.type) {
    case 'Value':
      promise = new Implementation.ValueStatGetter(model, request.body, opts)
        .perform();
      break;
    case 'Pie':
      promise = new Implementation.PieStatGetter(model, request.body, opts)
        .perform();
      break;
    case 'Line':
      promise = new Implementation.LineStatGetter(model, request.body, opts)
        .perform();
      break;
    }

    if (!promise) {
      return response.status(400).send({ error: 'Chart type not found.' });
    }

    promise
      .then(function (stat) {
        return new StatSerializer(stat).perform();
      })
      .then(function (stat) { response.send(stat); })
      .catch(next);
  };

  this.perform = function () {
    app.post(path.generate('stats/' + modelName, opts), auth.ensureAuthenticated, this.get);
  };
};
