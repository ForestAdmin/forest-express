const CloseIo = require('./close.io');
const Intercom = require('./intercom');
const Layer = require('./layer');
const MixPanel = require('./mixpanel');
const Stripe = require('./stripe');

function IntegrationChecker(opts, Implementation) {
  const modules = [
    new CloseIo(opts, Implementation),
    new Intercom(opts, Implementation),
    new Layer(opts, Implementation),
    new MixPanel(opts, Implementation),
    new Stripe(opts, Implementation),
  ];

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
