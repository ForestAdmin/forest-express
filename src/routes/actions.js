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

  getHookLoadController(action, model, Implementation) {
    return async (request, response) => {
      const fail = (message) => {
        this.logger.error('Error in smart action load hook: ', message);
        return response.status(500).send({ message });
      };

      const isResultConsistant = (fields, previousFields) => {
        const containsAll = (left, right) =>
          Object.keys(left).every((key) => Object.keys(right).includes(key));
        return containsAll(fields, previousFields) && containsAll(previousFields, fields);
      };

      const recordId = request.body.data.attributes.recordsId[0];
      const record = await new Implementation.ResourceGetter(model, { recordId }).perform();
      const fields = action.field.map((field) => ({ ...field, value: null }));

      if (typeof action.hooks.load !== 'function') return fail('load must be a function');

      try {
        const result = await action.hooks.load({ record, fields });

        if (!(result && typeof result === 'object')) {
          return fail('load hook must return an object');
        }
        if (!isResultConsistant(result, fields)) {
          return fail('fields must be unchanged (no addtion nor deletion allowed)');
        }

        return response.status(200).send({ fields: result });
      } catch (e) {
        return fail(e);
      }
    };
  }

  getRoute(action, path, options) {
    if (action.endpoint) {
      return this.path.generateForSmartActionCustomEndpoint(`${action.endpoint}/${path}`, options);
    }
    const actionName = this.stringUtils.parameterize(action.name);
    return this.path.generate(`actions/${actionName}/${path}`, options);
  }

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
