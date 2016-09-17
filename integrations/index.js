'use strict';
var fs = require('fs');

function IntegrationChecker(opts) {
  var modules = [];

  fs
    .readdirSync(__dirname)
    .filter(function (file) {
      return (file.indexOf('.') !== 0) && (file !== 'index.js');
    })
    .forEach(function (directory) {
      var Mod = require('./' + directory);
      modules.push(new Mod(opts));
    });

  this.defineRoutes = function (app, model, Implementation) {
    modules.forEach(function (module) {
      module.defineRoutes(app, model, Implementation);
    });
  };

  this.defineCollections = function (Implementation, collections) {
    modules.forEach(function (module) {
      module.defineCollections(Implementation, collections);
    });
  };

  this.defineFields = function (Implementation, model, schema) {
    modules.forEach(function (module) {
      module.defineFields(Implementation, model, schema);
    });
  };

  this.defineSerializationOption = function (Implementation, model, schema,
    dest, field) {
    modules.forEach(function (module) {
      module.defineSerializationOption(Implementation, model, schema, dest,
        field);
    });
  };
}

module.exports = IntegrationChecker;
