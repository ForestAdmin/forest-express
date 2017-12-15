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

  this.query = function (req, res, next) {
    return new Implementation.QueryStatGetter(req.body, opts)
      .perform()
      .then(function (stat) {
        switch (req.body.type) {
          case 'Value':
            if (stat.length) {
              stat = stat[0];
              if (!stat.value) {
                throw new Error('The result columns must be named ' +
                  '\'value\' instead of \'' +
                  Object.keys(stat).join(', ') + '\'');
              } else {
                stat = {
                  countCurrent: stat.value,
                  countPrevious: stat.previous
                };
              }
            }
            break;
          case 'Pie':
            if (stat.length) {
              stat.forEach(function (s) {
                if (!s.value || !s.key) {
                  throw new Error('The result columns must be named ' +
                    '\'key, value\' instead of \'' +
                    Object.keys(s).join(', ') + '\'');
                }
              });
            }
            break;
          case 'Line':
            if (stat.length) {
              stat.forEach(function (s) {
                if (!s.value || !s.key) {
                  throw new Error('The result columns must be named ' +
                    '\'key, value\' instead of \'' +
                    Object.keys(s).join(', ') + '\'');
                }
              });
            }

            stat = stat.map(function (s) {
              return { label: s.key, values: { value: s.value }};
            });
            break;
        }

        return new StatSerializer({ value: stat }).perform();
      })
      .then(function (stat) {
        res.send(stat);
      })
      .catch(next);
  };

  this.perform = function () {
    app.post(path.generate('stats/' + modelName, opts), auth.ensureAuthenticated, this.get);
    app.post('/stats', auth.ensureAuthenticated, this.query);
  };
};
