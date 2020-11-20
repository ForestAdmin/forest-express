const context = require('../context');

class Actions {
  constructor({
    logger, pathService, stringUtils, schemasGenerator,
  } = context.inject()) {
    this.path = pathService;
    this.logger = logger;
    this.stringUtils = stringUtils;
    this.schemasGenerator = schemasGenerator;
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

  perform(app, model, Implementation, options, auth) {
    const modelName = Implementation.getModelName(model);
    const schema = this.schemasGenerator.schemas[modelName];

    if (!schema.actions) return;

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
