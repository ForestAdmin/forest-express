const P = require('bluebird');
const _ = require('lodash');
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('express-jwt');
const auth = require('./services/auth');
const ResourcesRoutes = require('./routes/resources');
const ActionsRoutes = require('./routes/actions');
const AssociationsRoutes = require('./routes/associations');
const StatRoutes = require('./routes/stats');
const SessionRoute = require('./routes/sessions');
const ForestRoutes = require('./routes/forest');
const Schemas = require('./generators/schemas');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const logger = require('./services/logger');
const Integrator = require('./integrations');
const errorHandler = require('./services/error-handler');
const ApimapSender = require('./services/apimap-sender');
const ipWhitelist = require('./services/ip-whitelist');
const ApimapFieldsFormater = require('./services/apimap-fields-formater');

const readdirAsync = P.promisify(fs.readdir);

let jwtAuthenticator;

function getModels(Implementation) {
  const models = Implementation.getModels();
  _.each(models, (model, modelName) => {
    model.modelName = modelName;
  });

  return _.values(models);
}

function requireAllModels(Implementation, modelsDir) {
  if (modelsDir) {
    return readdirAsync(modelsDir)
      .each((file) => {
        try {
          if (file.endsWith('.js') || (file.endsWith('.ts') && !file.endsWith('.d.ts'))) {
            if (fs.statSync(path.join(modelsDir, file)).isFile()) {
              // eslint-disable-next-line
              require(path.join(modelsDir, file));
            }
          }
        } catch (error) {
          logger.error(`Cannot read your model in the file ${file} for the following reason:`, error);
        }
      })
      .then(() => getModels(Implementation))
      .catch((error) => {
        logger.error(`Cannot read your models for the following reason: ${error.message}`, error);
        return P.resolve([]);
      });
  }

  // NOTICE: User didn't provide a modelsDir but may already have required
  // them manually so they might be available.
  return P.resolve(getModels(Implementation));
}

exports.Schemas = Schemas;
exports.logger = logger;
exports.ResourcesRoute = {};

exports.ensureAuthenticated = (request, response, next) => {
  auth.authenticate(request, response, next, jwtAuthenticator);
};

let alreadyInitialized = false;

exports.init = (Implementation) => {
  const { opts } = Implementation;
  const app = express();
  let integrator;

  if (alreadyInitialized) {
    logger.warn('Forest init function called more than once. Only the first call has been processed.');
    return app;
  }

  alreadyInitialized = true;

  auth.initAuth(opts);

  if (opts.secretKey) {
    logger.warn('DEPRECATION WARNING: The use of secretKey and authKey options ' +
    'is deprecated. Please use envSecret and authSecret instead.');
    opts.envSecret = opts.secretKey;
    opts.authSecret = opts.authKey;
  }

  // CORS
  let allowedOrigins = ['localhost:4200', /\.forestadmin\.com$/];

  if (process.env.CORS_ORIGINS) {
    allowedOrigins = allowedOrigins.concat(process.env.CORS_ORIGINS.split(','));
  }

  app.use(cors({
    origin: allowedOrigins,
    maxAge: 86400, // NOTICE: 1 day
  }));

  // Mime type
  app.use(bodyParser.json());

  // Authentication
  if (opts.authSecret) {
    jwtAuthenticator = jwt({
      secret: opts.authSecret,
      credentialsRequired: false,
      getToken: (request) => {
        if (request.headers && request.headers.authorization &&
          request.headers.authorization.split(' ')[0] === 'Bearer') {
          return request.headers.authorization.split(' ')[1];
        } else if (request.query && request.query.sessionToken) {
          return request.query.sessionToken;
        }
        return null;
      },
    });
  } else {
    logger.error('Your Forest authSecret seems to be missing. Can you check ' +
      'that you properly set a Forest authSecret in the Forest initializer?');
  }

  if (!opts.envSecret) {
    logger.error('Your Forest envSecret seems to be missing. Can you check ' +
      'that you properly set a Forest envSecret in the Forest initializer?');
  }

  if (jwtAuthenticator) {
    if (opts.expressParentApp) {
      // NOTICE: Forest is a sub-app of the client application; so all routes are
      //         protected with JWT.
      app.use(jwtAuthenticator);
    } else {
      // NOTICE: Forest routes are part of the client app; only Forest routes
      //         are protected with JWT.
      app.use(jwtAuthenticator.unless({ path: /^((?!.*\/forest\/).)*$/ }));
    }
  }

  new SessionRoute(app, opts).perform();

  // Init
  const absModelDirs = opts.modelsDir ? path.resolve('.', opts.modelsDir) : undefined;
  requireAllModels(Implementation, absModelDirs)
    .then((models) => {
      integrator = new Integrator(opts, Implementation);

      return Schemas.perform(Implementation, integrator, models, opts)
        .then(() => {
          let directorySmartImplementation;

          if (opts.configDir) {
            directorySmartImplementation = path.resolve('.', opts.configDir);
          } else {
            directorySmartImplementation = `${path.resolve('.')}/forest`;
          }

          if (fs.existsSync(directorySmartImplementation)) {
            return requireAllModels(Implementation, directorySmartImplementation);
          }
          if (opts.configDir) {
            logger.error('The Forest modelsDir option you configured does not seem to be an existing directory.');
          }
          return [];
        })
        .thenReturn(models);
    })
    .each((model) => {
      const modelName = Implementation.getModelName(model);

      integrator.defineRoutes(app, model, Implementation);

      const resourcesRoute = new ResourcesRoutes(app, model, Implementation, integrator, opts);
      resourcesRoute.perform();
      exports.ResourcesRoute[modelName] = resourcesRoute;

      new AssociationsRoutes(app, model, Implementation, integrator, opts).perform();
      new ActionsRoutes(app, model, Implementation, integrator, opts).perform();

      new StatRoutes(app, model, Implementation, opts).perform();
    })
    .then(() => new ForestRoutes(app, opts).perform())
    .then(() => app.use(errorHandler.catchIfAny))
    .then(() => {
      if (opts.envSecret && opts.envSecret.length !== 64) {
        logger.error('Your envSecret does not seem to be correct. Can you ' +
          'check on Forest that you copied it properly in the Forest ' +
          'initialization?');
      } else if (opts.envSecret) {
        const forestadminSchemaFilename = `${path.resolve('.')}/forestadmin-schema.json`;
        let collections = [];
        if (process.env.NOD_ENV === 'production') {
          try {
            const content = fs.readFileSync(forestadminSchemaFilename);
            if (!content) {
              logger.error('Your forestadmin-schema.json is empty, the apimap cannot be send');
            } else {
              collections = JSON.parse(content);
            }
          } catch (error) {
            if (error.code === 'ENOENT') {
              logger.error('forestadmin-schema.json does not exists, the apimap cannot be send');
            } else {
              logger.error('the content of forestadmin-schema.json is not a correct JSON, the apimap cannot be send');
            }
          }
        } else {
          collections = _.values(Schemas.schemas);
        }
        integrator.defineCollections(collections);

        // NOTICE: Check each Smart Action declaration to detect configuration
        //         errors.
        _.each(collections, (collection) => {
          if (collection.actions) {
            _.each(collection.actions, (action) => {
              if (action.fields && !_.isArray(action.fields)) {
                logger.error(`Cannot find the fields you defined for the Smart action "${action.name}" of your "${collection.name}" collection. The fields option must be an array.`);
              }
            });
          }
        });

        if (process.env.NODE_ENV !== 'production') {
          const filename = `${path.resolve('.')}/forestadmin-schema.json`;
          fs.writeFileSync(filename, JSON.stringify(collections, null, 2));
        }

        if (process.env.FOREST_DISABLE_AUTO_SCHEMA_APPLY) {
          return;
        }

        const apimap = new JSONAPISerializer('collections', collections, {
          id: 'name',
          // TODO: Remove nameOld attribute once the lianas versions older than 2.0.0 are minority.
          attributes: ['name', 'nameOld', 'displayName', 'paginationType', 'icon',
            'fields', 'actions', 'segments', 'onlyForRelationships',
            'isVirtual', 'integration', 'isReadOnly', 'isSearchable'],
          fields: {
            attributes: ['field', 'displayName', 'type', 'relationship', 'enums',
              'collection_name', 'reference', 'column', 'isFilterable',
              'widget', 'integration', 'isReadOnly', 'isVirtual',
              'isRequired', 'defaultValue', 'validations', 'isSortable'],
          },
          validations: {
            attributes: ['type', 'value', 'message'],
          },
          actions: {
            ref: 'id',
            attributes: ['name', 'baseUrl', 'endpoint', 'redirect', 'download', 'global', 'type',
              'httpMethod', 'fields'], // TODO: Remove global attribute when we remove the deprecation warning.
          },
          segments: {
            ref: 'id',
            attributes: ['name'],
          },
          meta: {
            liana: Implementation.getLianaName(),
            liana_version: Implementation.getLianaVersion(),
            orm_version: Implementation.getOrmVersion(),
            database_type: Implementation.getDatabaseType(),
          },
        });

        new ApimapSender(opts.envSecret, apimap).perform();
      }
    })
    .then(() => ipWhitelist
      .retrieve(opts.envSecret)
      .catch(error => logger.error(error)))
    .catch((error) => {
      logger.error('An error occured while computing the Forest apimap. Your ' +
        'application apimap cannot be sent to Forest. Your Admin UI might ' +
        'not reflect your application models.', error);
    });

  if (opts.expressParentApp) {
    opts.expressParentApp.use('/forest', app);
  }

  return app;
};

exports.collection = (name, opts) => {
  if (_.isEmpty(Schemas.schemas) && opts.modelsDir) {
    logger.error(`Cannot customize your collection named "${name}" properly. Did you call the "collection" method in the /forest directory?`);
    return;
  }

  let collection = _.find(Schemas.schemas, { name });

  if (!collection) {
    collection = _.find(Schemas.schemas, { nameOld: name });
    if (collection) {
      name = collection.name;
      logger.warn(`DEPRECATION WARNING: Collection names are now based on the models names. Please rename the collection "${collection.nameOld}" of your Forest customisation in "${collection.name}".`);
    }
  }

  // NOTICE: Action ids are defined concatenating the collection name and the
  //         action name to prevent action id conflicts between collections.
  _.each(opts.actions, (action) => {
    action.id = `${name}.${action.name}`;
  });

  _.each(opts.segments, (segment) => {
    segment.id = `${name}.${segment.name}`;
  });

  if (collection) {
    if (!Schemas.schemas[name].actions) { Schemas.schemas[name].actions = []; }
    if (!Schemas.schemas[name].segments) { Schemas.schemas[name].segments = []; }

    Schemas.schemas[name].actions = _.union(opts.actions, Schemas.schemas[name].actions);
    Schemas.schemas[name].segments = _.union(opts.segments, Schemas.schemas[name].segments);

    // NOTICE: Smart Field definition case
    opts.fields = new ApimapFieldsFormater(opts.fields, name).perform();
    Schemas.schemas[name].fields = _.concat(opts.fields, Schemas.schemas[name].fields);

    if (opts.searchFields) {
      Schemas.schemas[name].searchFields = opts.searchFields;
    }
  } else {
    // NOTICE: Smart Collection definition case
    opts.name = name;
    opts.idField = 'id';
    opts.isVirtual = true;
    opts.isSearchable = !!opts.isSearchable;
    opts.fields = new ApimapFieldsFormater(opts.fields, name).perform();
    Schemas.schemas[name] = opts;
  }

  if (Schemas.schemas[name].actions) {
    _.each(Schemas.schemas[name].actions, (action) => {
      if (action.global) {
        logger.warn(`DEPRECATION WARNING: Smart Action "global" option is now deprecated. Please set "type: 'global'" instead of "global: true" for the "${action.name}" Smart Action.`);
      }

      if (action.type && !_.includes(['bulk', 'global', 'single'], action.type)) {
        logger.warn(`Please set a valid Smart Action type ("bulk", "global" or "single") for the "${action.name}" Smart Action.`);
      }

      // NOTICE: Set a position to the Smart Actions fields.
      _.each(action.fields, (field, position) => {
        field.position = position;
      });
    });
  }
};

exports.logger = require('./services/logger');
exports.StatSerializer = require('./serializers/stat');
exports.ResourceSerializer = require('./serializers/resource');
exports.ResourceDeserializer = require('./deserializers/resource');
