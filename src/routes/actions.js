const { inject } = require('@forestadmin/context');

/**
 * This class generates routes for handling smart actions' form hooks and legacy routes.
 */
class Actions {
  constructor({
    logger,
    pathService,
    stringUtils,
    schemasGenerator,
    smartActionHookService,
    smartActionHookDeserializer,
  } = inject()) {
    this.path = pathService;
    this.logger = logger;
    this.stringUtils = stringUtils;
    this.schemasGenerator = schemasGenerator;
    this.smartActionHookService = smartActionHookService;
    this.smartActionHookDeserializer = smartActionHookDeserializer;
  }

  /**
   * Generate a callback for express that handles the `load` hook.
   *
   * @param {Object} action The smart action
   * @returns {Function} A route callback for express
   */
  getHookLoadController(action) {
    return async (request, response) => {
      try {
        const hookResponse = await this.smartActionHookService.getResponse(
          action,
          action.hooks.load,
          action.fields,
          request,
        );
        return response.status(200).send(hookResponse);
      } catch (error) {
        this.logger.error('Error in smart load action hook: ', error);
        return response.status(500).send({ message: error.message });
      }
    };
  }

  /**
   * Generate a callback for express that handles the `change` hook.
   *
   * @param {Object} action The smart action
   * @returns {Function} A route callback for express
   */
  getHookChangeController(action) {
    return async (request, response) => {
      try {
        const data = this.smartActionHookDeserializer.deserialize(request.body);

        const { fields, changedField } = data;
        const fieldChanged = fields.find((field) => field.field === changedField);

        const hookResponse = await this.smartActionHookService.getResponse(
          action,
          action.hooks.change[fieldChanged?.hook],
          fields,
          request,
          fieldChanged,
        );

        return response.status(200).send(hookResponse);
      } catch (error) {
        this.logger.error('Error in smart action change hook: ', error);
        return response.status(500).send({ message: error.message });
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
   * Build routes for each form hooks and legacy values routes.
   *
   * @param {Array} actions list of actions
   */
  buildRoutes(actions) {
    const createDynamicRoute = (route, controller) =>
      this.app.post(route, this.auth.ensureAuthenticated, controller);

    actions.forEach((action) => {
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
   * @param {*} schema The schema (collection) associated with the action
   * @param {*} model The model associated with the action (is undefined for smart collection)
   * @param {*} Implementation Gives access to current Implementation (mongoose or sequelize)
   * @param {*} options Environment options
   * @param {*} auth Auth instance
   */
  perform(app, schema, model, Implementation, options, auth) {
    this.implementation = Implementation;
    this.model = model;
    this.app = app;
    this.options = options;
    this.auth = auth;

    if (!schema || !schema.actions) return;

    this.buildRoutes(schema.actions);
  }
}

module.exports = Actions;
