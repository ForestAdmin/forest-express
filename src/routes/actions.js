const context = require('../context');

/**
 * This class generates routes for handling smart actions' form hooks and legacy routes.
 */
class Actions {
  constructor({
    logger, pathService, stringUtils, schemasGenerator,
  } = context.inject()) {
    this.path = pathService;
    this.logger = logger;
    this.stringUtils = stringUtils;
    this.schemasGenerator = schemasGenerator;
  }

  /**
   * Compare two sets of fields keys, returns true if both have the same keys.
   * An error has to be thrown in getHookLoadController() when a field is deleted or added
   * (new key or missing key in fields).
   *
   * @param {Object} fields The fields we want to compare
   * @param {Object} previousFields The fields we want to compare
   * @see getHookLoadController() for usage
   */
  static areFieldsConsistant(fields, previousFields) {
    const containsAll = (left, right) =>
      Object.keys(left).every((key) => Object.keys(right).includes(key));
    return containsAll(fields, previousFields) && containsAll(previousFields, fields);
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

      if (!(values.then && typeof func === 'function')) return successResponse(values);

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
      const fail = (message) => {
        this.logger.error('Error in smart action load hook: ', message);
        return response.status(500).send({ message });
      };

      const recordId = request.body.data.attributes.recordsId[0];
      const record = await new Implementation.ResourceGetter(model, { recordId }).perform();
      const fields = action.field.map((field) => ({ ...field, value: null }));

      try {
        if (typeof action.hooks.load !== 'function') throw new Error('load must be a function');

        const result = await action.hooks.load({ record, fields });

        if (!(result && typeof result === 'object')) {
          throw new Error('load hook must return an object');
        } else if (!Actions.areFieldsConsistant(result, fields)) {
          throw new Error('fields must be unchanged (no addition nor deletion allowed)');
        }

        return response.status(200).send({ fields: result });
      } catch (e) {
        return fail(e.message);
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
