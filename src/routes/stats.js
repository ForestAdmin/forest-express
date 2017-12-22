'use strict';
var auth = require('../services/auth');
var path = require('../services/path');
var StatSerializer = require('../serializers/stat');

module.exports = function (app, model, Implementation, opts) {
  var modelName = Implementation.getModelName(model);

  this.create = function (req, res, next) {
    var promise = null;

    switch (req.body.type) {
      case 'Value':
        promise = new Implementation.ValueStatGetter(model, req.body, opts)
          .perform();
        break;
      case 'Pie':
        promise = new Implementation.PieStatGetter(model, req.body, opts)
          .perform();
        break;
      case 'Line':
        promise = new Implementation.LineStatGetter(model, req.body, opts)
          .perform();
        break;
    }

    if (!promise) {
      return res.status(400).send({ error: 'Chart type not found.' });
    }

    promise
      .then(function (stat) {
        return new StatSerializer(stat).perform();
      })
      .then(function (stat) {
        res.send(stat);
      })
      .catch(next);
  };

  this.perform = function () {
    app.post(path.generate('stats/' + modelName, opts), auth.ensureAuthenticated,
      this.create);
  };
};
