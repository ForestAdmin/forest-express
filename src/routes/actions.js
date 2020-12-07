const context = require('../context');

/**
 * This class generates routes for handling smart actions' form hooks and legacy routes.
 */
class Actions {
  constructor({
    logger, pathService, stringUtils, schemasGenerator, smartActionHook,
  } = context.inject()) {
    this.path = pathService;
    this.logger = logger;
    this.stringUtils = stringUtils;
    this.schemasGenerator = schemasGenerator;
    this.smartActionHook = smartActionHook;
  }

  /**
   * Generate a callback for express that handles the `values` route.
   * This legacy route is used to handle smart actions' forms initialization.
   * Users should use the `load` hook now.
   *
   * @param {Object} action The smart action
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
   * @param {Number} recordId
   */
  async getRecord(recordId) {
    return new this.implementation
      .ResourceGetter(this.model, { recordId }).perform();
  }

  /**
   * Generic hook controller.
   *
   * @param {Object} request the express.js request object
   * @param {Object} response the express.js response object
   * @param {Function} hook returns the response thanks to smartActionHook service
   * @returns {*} the express.js response object
   * @see getHookLoadController and getHookChangeController
   */
  async getHook(request, response, hook) {
    const record = await this.getRecord(request.body.recordIds[0]);

    try {
      const updatedFields = await hook(record);

      return response.status(200).send({ fields: updatedFields });
    } catch (error) {
      this.logger.error('Error in smart action load hook: ', error);
      return response.status(500).send({ message: error.message });
    }
  }

  /**
   * Generate a callback for express that handles the `load` hook.
   *
   * @param {Object} action The smart action
   * @returns {Function} A route callback for express
   */
  getHookLoadController(action) {
    return async (request, response) => (
      this.getHook(request, response, async (record) => this.smartActionHook.getResponse(
        action.hooks.load,
        action.fields,
        record,
      )));
  }

  /**
   * Generate a callback for express that handles the `change` hook.
   *
   * @param {Object} action The smart action
   * @returns {Function} A route callback for express
   */
  getHookChangeController(action) {
    return async (request, response) => {
      const field = request.body.fields
        .find((item) => item.previousValue !== item.value);

      return this.getHook(request, response, async (record) => this.smartActionHook.getResponse(
        field && field.field ? action.hooks.change[field.field] : null,
        request.body.fields,
        record,
      ));
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
   * Build routes for each form hooks and legacy values routes.
   *
   * @param {Array} actions list of actions
   */
  buildRoutes(actions) {
    const createDynamicRoute = (route, controller) =>
      this.app.post(route, this.auth.ensureAuthenticated, controller);

    actions.forEach((action) => {
      // Create a `values` routes for smart actions.
      // One route is created for each action which have a `values` property.
      if (action.values) {
        createDynamicRoute(
          this.getRoute(action, 'values', this.options),
          this.getValuesController(action),
        );
      }
      // Create a `load` routes for smart actions.
      // One route is created for each action which have a `hooks.load` property.
      if (action.hooks && action.hooks.load) {
        createDynamicRoute(
          this.getRoute(action, 'hooks/load', this.options),
          this.getHookLoadController(action),
        );
      }
      // Create a `change` routes for smart actions.
      // One route is created for each action which have a `hooks.change` property.
      if (action.hooks && action.hooks.change) {
        createDynamicRoute(
          this.getRoute(action, 'hooks/change', this.options),
          this.getHookChangeController(action),
        );
      }
    });
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
    this.implementation = Implementation;
    this.model = model;
    this.app = app;
    this.options = options;
    this.auth = auth;

    const modelName = Implementation.getModelName(model);
    const schema = this.schemasGenerator.schemas[modelName];

    if (!schema.actions) return;

    this.buildRoutes(schema.actions);
  }
}

module.exports = Actions;
