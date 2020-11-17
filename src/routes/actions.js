const { inject } = require('../context');

class Actions {
  constructor({ logger, pathService, stringUtils } = inject()) {
    this.path = pathService;
    this.logger = logger;
    this.stringUtils = stringUtils;
  }

  getFormValuesController(action) {
    return (request, response) => {
      let values = action.values ? action.values(request.body.data.attributes.values) : {};

      if (!(values.then && typeof func === 'function')) {
        return response.status(200).send(values);
      }

      return values
        .then((valuesComputed) => {
          values = valuesComputed;
        })
        .catch((error) => {
          this.logger.error(`Cannot send the values of the "${action.name}" Smart Actions because of an unexpected error: `, error);
          values = {};
        })
        .finally(() => response.status(200).send(values));
    };
  }

  // TODO: Inject `schemas` when https://github.com/ForestAdmin/forest-express/pull/539 is merged.
  perform(app, model, Implementation, options, auth, schemas) {
    const modelName = Implementation.getModelName(model);
    const schema = schemas[modelName];
    schema.actions
      .filter((action) => action.values)
      .forEach((action) => {
        const route = action.endpoint
          ? this.path.generateForSmartActionCustomEndpoint(`${action.endpoint}/values`, options)
          : this.path.generate(`actions/${this.stringUtils.parameterize(action.name)}/values`, options);

        app.post(route, auth.ensureAuthenticated, this.getFormValuesController(action));
      });
  }
}

module.exports = Actions;
