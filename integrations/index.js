'use strict';
var fs = require('fs');

function IntegrationChecker(opts, Implementation) {
  var modules = [];

  fs
    .readdirSync(__dirname)
    .filter(function (file) {
      return (file.indexOf('.') !== 0) && (file !== 'index.js');
    })
    .forEach(function (directory) {
      var Mod = require('./' + directory);
      modules.push(new Mod(opts, Implementation));
    });

  this.defineRoutes = function (app, model) {
    modules.forEach(function (module) {
      if (module.defineRoutes) {
        module.defineRoutes(app, model);
      }
    });
  };

  this.defineCollections = function (collections) {
    modules.forEach(function (module) {
      if (module.defineCollections) {
        module.defineCollections(collections);
      }
    });
  };

  this.defineSegments = function (model, schema) {
    modules.forEach(function (module) {
      if (module.defineSegments) {
        module.defineSegments(model, schema);
      }
    });
  };

  this.defineFields = function (model, schema) {
    modules.forEach(function (module) {
      if (module.defineFields) {
        module.defineFields(model, schema);
      }
    });
  };

  this.defineSerializationOption = function (model, schema, dest, field) {
    modules.forEach(function (module) {
      if (module.defineSerializationOption) {
        module.defineSerializationOption(model, schema, dest,
          field);
      }
    });
  };
}

module.exports = IntegrationChecker;
