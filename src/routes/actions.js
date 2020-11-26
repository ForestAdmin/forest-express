const context = require('../context');

/**
 * This class generates routes for handling smart actions' form hooks and legacy routes.
 */
class Actions {
  constructor({
    logger, pathService, stringUtils, schemasGenerator, hookLoad,
  } = context.inject()) {
    this.path = pathService;
    this.logger = logger;
    this.stringUtils = stringUtils;
    this.schemasGenerator = schemasGenerator;
    this.hookLoad = hookLoad;
  }

  /**
   * Generate a callback for express that handles the `values` route.
   * This legacy route is used to handle smart actions' forms initialization.
   * Users should use the `load` hook now.
   *
   * @param {*} action The smart action
   * @returns {Function} A route callback for express
   */
  getValuesController(action) {
    return (request, response) => {
      const successResponse = (object) => response.status(200).send(object);
      const values = action.values ? action.values(request.body.data.attributes.values) : {};

      if (!(values.then && typeof values.then === 'function')) return successResponse(values);

      return values
        .then((valuesComputed) => successResponse(valuesComputed))
        .catch((error) => {
          this.logger.error(`Cannot send the values of the "${action.name}" Smart Actions because of an unexpected error: `, error);
          return successResponse({});
        });
    };
  }

  /**
   * Generate a callback for express that handles the `load` hook.
   *
   * @param {*} action The smart action
   * @param {*} model The model of the smart action
   * @param {*} Implementation Gives access to current Implementation (mongoose or sequelize)
   * @returns {Function} A route callback for express
   */
  getHookLoadController(action, model, Implementation) {
    return async (request, response) => {
      const recordId = request.body.recordsId[0];
      const record = await new Implementation.ResourceGetter(model, { recordId }).perform();

      try {
        const updatedFields = await this.hookLoad.getResponse(
          action.hooks.load,
          action.fields,
          record,
        );

        return response.status(200).send({ fields: updatedFields });
      } catch ({ message }) {
        this.logger.error('Error in smart action load hook: ', message);
        return response.status(500).send({ message });
      }
    };
  }

  /**
   * Generate path for a smart action route.
   *
   * @param {*} action The smart action
   * @param {String} path The path to the hook
   * @param {*} options Environement actions
   * @returns {String} The generated path
   */
  getRoute(action, path, options) {
    if (action.endpoint) {
      return this.path.generateForSmartActionCustomEndpoint(`${action.endpoint}/${path}`, options);
    }
    const actionName = this.stringUtils.parameterize(action.name);
    return this.path.generate(`actions/${actionName}/${path}`, options);
  }

  /**
   *  Generate routes for smart action hooks (and the legacy values object).
   *
   * @param {*} app Express instance (route are attached to this object)
   * @param {*} model The model associated with the action
   * @param {*} Implementation Gives access to current Implementation (mongoose or sequelize)
   * @param {*} options Environment options
   * @param {*} auth Auth instance
   */
  perform(app, model, Implementation, options, auth) {
    const modelName = Implementation.getModelName(model);
    const schema = this.schemasGenerator.schemas[modelName];

    if (!schema.actions) return;

    // Create a `values` routes for smart actions.
    // One route is created for each action which have a `values` property.
    schema.actions.filter((action) => action.values)
      .forEach((action) => {
        app.post(
          this.getRoute(action, 'values', options),
          auth.ensureAuthenticated,
          this.getValuesController(action),
        );
      });
    // Create a `load` routes for smart actions.
    // One route is created for each action which have a `hooks.load` property.
    schema.actions.filter((action) => action.hooks && action.hooks.load)
      .forEach((action) => {
        app.post(
          this.getRoute(action, 'hooks/load', options),
          auth.ensureAuthenticated,
          this.getHookLoadController(action, model, Implementation),
        );
      });
  }
}

module.exports = Actions;
