const fs = require('fs');

function IntegrationChecker(opts, Implementation) {
  const modules = [];

  fs
    .readdirSync(__dirname)
    .filter((file) => (file.indexOf('.') !== 0) && (file !== 'index.js'))
    .forEach((directory) => {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const Mod = require(`./${directory}`);
      modules.push(new Mod(opts, Implementation));
    });

  this.defineRoutes = (app, model) => {
    modules.forEach((module) => {
      if (module.defineRoutes) {
        module.defineRoutes(app, model);
      }
    });
  };

  this.defineCollections = (collections) => {
    modules.forEach((module) => {
      if (module.defineCollections) {
        module.defineCollections(collections);
      }
    });
  };

  this.defineSegments = (model, schema) => {
    modules.forEach((module) => {
      if (module.defineSegments) {
        module.defineSegments(model, schema);
      }
    });
  };

  this.defineFields = (model, schema) => {
    modules.forEach((module) => {
      if (module.defineFields) {
        module.defineFields(model, schema);
      }
    });
  };

  this.defineSerializationOption = (model, schema, dest, field) => {
    modules.forEach((module) => {
      if (module.defineSerializationOption) {
        module.defineSerializationOption(model, schema, dest, field);
      }
    });
  };
}

module.exports = IntegrationChecker;
