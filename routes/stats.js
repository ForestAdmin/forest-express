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

  function ErrorQueryColumnsName(result) {
    return new Error('The result columns must be named \'value\' instead of \'' +
      Object.keys(result).join(', ') + '\'.');
  }

  this.getWithLiveQuery = function (request, response, next) {
    return new Implementation.QueryStatGetter(request.body, opts)
      .perform()
      .then(function (result) {
        switch (request.body.type) {
        case 'Value':
          if (result.length) {
            var resultLine = result[0];
            if (!resultLine.value) {
              throw ErrorQueryColumnsName(resultLine);
            } else {
              result = {
                countCurrent: resultLine.value,
                countPrevious: resultLine.previous
              };
            }
          }
          break;
        case 'Pie':
          if (result.length) {
            result.forEach(function (resultLine) {
              if (!resultLine.value || !resultLine.key) {
                throw ErrorQueryColumnsName(resultLine);
              }
            });
          }
          break;
        case 'Line':
          if (result.length) {
            result.forEach(function (resultLine) {
              if (!resultLine.value || !resultLine.key) {
                throw ErrorQueryColumnsName(resultLine);
              }
            });
          }

          result = result.map(function (resultLine) {
            return {
              label: resultLine.key,
              values: {
                value: resultLine.value,
              },
            };
          });
          break;
        }

        return new StatSerializer({ value: result }).perform();
      })
      .then(function (data) { response.send(data); })
      .catch(next);
  };

  this.perform = function () {
    app.post(path.generate('stats/' + modelName, opts), auth.ensureAuthenticated, this.get);
    app.post(path.generate('stats', opts), auth.ensureAuthenticated, this.getWithLiveQuery);
  };
};
