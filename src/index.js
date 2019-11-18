const P = require('bluebird');
const _ = require('lodash');
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('express-jwt');
const requireAll = require('require-all');
const auth = require('./services/auth');
const ResourcesRoutes = require('./routes/resources');
const ActionsRoutes = require('./routes/actions');
const AssociationsRoutes = require('./routes/associations');
const StatRoutes = require('./routes/stats');
const SessionRoute = require('./routes/sessions');
const ForestRoutes = require('./routes/forest');
const Schemas = require('./generators/schemas');
const SchemaSerializer = require('./serializers/schema');
const logger = require('./services/logger');
const pathService = require('./services/path');
const Integrator = require('./integrations');
const errorHandler = require('./services/error-handler');
const ApimapSender = require('./services/apimap-sender');
const ipWhitelist = require('./services/ip-whitelist');
const SchemaFileUpdater = require('./services/schema-file-updater');
const ApimapFieldsFormater = require('./services/apimap-fields-formater');
const StateManager = require('./services/state-manager');

const ENVIRONMENT_DEVELOPMENT = !process.env.NODE_ENV
|| ['dev', 'development'].includes(process.env.NODE_ENV);
const SCHEMA_FILENAME = `${path.resolve('.')}/.forestadmin-schema.json`;
const DISABLE_AUTO_SCHEMA_APPLY = process.env.FOREST_DISABLE_AUTO_SCHEMA_APPLY
&& JSON.parse(process.env.FOREST_DISABLE_AUTO_SCHEMA_APPLY);
const REGEX_COOKIE_SESSION_TOKEN = /forest_session_token=([^;]*)/;
const stateManager = StateManager.getInstance();


let jwtAuthenticator;

function getModels() {
  const models = stateManager.Implementation.getModels();
  _.each(models, (model, modelName) => {
    model.modelName = modelName;
  });

  return _.values(models);
}

function requireAllModels(modelsDir) {
  if (modelsDir) {
    try {
      requireAll({
        dirname: modelsDir,
        filter: fileName =>
          fileName.endsWith('.js') || (fileName.endsWith('.ts') && !fileName.endsWith('.d.ts')),
        recursive: true,
      });
    } catch (error) {
      logger.error(`Cannot read a file for the following reason: ${error.message}`, error);
    }
  }

  // NOTICE: User didn't provide a modelsDir but may already have required them manually so they
  //         might be available.
  return P.resolve(getModels())
    .catch((error) => {
      logger.error(`Cannot read a file for the following reason: ${error.message}`, error);
      return P.resolve([]);
    });
}

exports.Schemas = Schemas;
exports.logger = logger;
exports.ResourcesRoute = {};

exports.ensureAuthenticated = (request, response, next) => {
  auth.authenticate(request, response, next, jwtAuthenticator);
};

let app = null;

function buildSchema() {
  const { lianaOptions, Implementation } = stateManager;
  const absModelDirs = stateManager.modelsDir ? path.resolve('.', stateManager.modelsDir) : undefined;
  return requireAllModels(absModelDirs)
    .then(async (models) => {
      stateManager.integrator = new Integrator(lianaOptions, Implementation);
      await Schemas.perform(
        Implementation,
        stateManager.integrator,
        models,
        lianaOptions,
      );
      return models;
    });
}

exports.init = (Implementation) => {
  const { opts } = Implementation;

  stateManager.Implementation = Implementation;
  stateManager.lianaOptions = opts;

  if (opts.onlyCrudModule === true) {
    return buildSchema();
  }

  if (app) {
    logger.warn('Forest init function called more than once. Only the first call has been processed.');
    return app;
  }

  app = express();
  const pathMounted = pathService.generate('*', opts);

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

  app.use(pathMounted, cors({
    origin: allowedOrigins,
    maxAge: 86400, // NOTICE: 1 day
    credentials: true,
  }));

  // Mime type
  app.use(pathMounted, bodyParser.json());

  // Authentication
  if (opts.authSecret) {
    jwtAuthenticator = jwt({
      secret: opts.authSecret,
      credentialsRequired: false,
      getToken: (request) => {
        if (request.headers) {
          if (request.headers.authorization
            && request.headers.authorization.split(' ')[0] === 'Bearer') {
            return request.headers.authorization.split(' ')[1];
          // NOTICE: Necessary for downloads authentication.
          } else if (request.headers.cookie) {
            const match = request.headers.cookie.match(REGEX_COOKIE_SESSION_TOKEN);
            if (match && match[1]) {
              return match[1];
            }
          }
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
    const pathsPublic = [/^\/forest\/sessions.*$/];
    app.use(pathMounted, jwtAuthenticator.unless({ path: pathsPublic }));
  }

  new SessionRoute(app, opts).perform();

  // Init
  buildSchema()
    .then((models) => {
      let directorySmartImplementation;

      if (opts.configDir) {
        directorySmartImplementation = path.resolve('.', opts.configDir);
      } else {
        directorySmartImplementation = `${path.resolve('.')}/forest`;
      }

      if (fs.existsSync(directorySmartImplementation)) {
        return requireAllModels(directorySmartImplementation);
      }
      if (opts.configDir) {
        logger.error('The Forest configDir option you configured does not seem to be an existing directory.');
      }

      return models;
    })
    .each((model) => {
      const modelName = stateManager.Implementation.getModelName(model);

      stateManager.integrator.defineRoutes(app, model, stateManager.Implementation);

      const resourcesRoute = new ResourcesRoutes(app, model);
      resourcesRoute.perform();
      exports.ResourcesRoute[modelName] = resourcesRoute;

      new AssociationsRoutes(
        app,
        model,
        stateManager.Implementation,
        stateManager.integrator,
        stateManager.lianaOptions,
      ).perform();
      new ActionsRoutes(
        app,
        model,
        stateManager.Implementation,
        stateManager.integrator,
        stateManager.lianaOptions,
      ).perform();

      new StatRoutes(
        app,
        model,
        stateManager.Implementation,
        stateManager.lianaOptions,
      ).perform();
    })
    .then(() => new ForestRoutes(app, stateManager.lianaOptions).perform())
    .then(() => app.use(pathMounted, errorHandler.catchIfAny))
    .then(() => {
      if (!opts.envSecret) { return; }

      if (opts.envSecret.length !== 64) {
        logger.error('Your envSecret does not seem to be correct. Can you check on Forest that ' +
          'you copied it properly in the Forest initialization?');
        return;
      }

      const collections = _.values(Schemas.schemas);
      stateManager.integrator.defineCollections(collections);

      // NOTICE: Check each Smart Action declaration to detect configuration errors.
      _.each(collections, (collection) => {
        if (collection.actions) {
          _.each(collection.actions, (action) => {
            if (action.fields && !_.isArray(action.fields)) {
              logger.error(`Cannot find the fields you defined for the Smart action "${action.name}" of your "${collection.name}" collection. The fields option must be an array.`);
            }
          });
        }
      });

      const schemaSerializer = new SchemaSerializer();
      const { options: serializerOptions } = schemaSerializer;
      let collectionsSent;
      let metaSent;

      if (ENVIRONMENT_DEVELOPMENT) {
        const meta = {
          database_type: stateManager.Implementation.getDatabaseType(),
          liana: stateManager.Implementation.getLianaName(),
          liana_version: stateManager.Implementation.getLianaVersion(),
          orm_version: stateManager.Implementation.getOrmVersion(),
        };
        const content = new SchemaFileUpdater(SCHEMA_FILENAME, collections, meta, serializerOptions)
          .perform();
        collectionsSent = content.collections;
        metaSent = content.meta;
      } else {
        try {
          const content = fs.readFileSync(SCHEMA_FILENAME);
          if (!content) {
            logger.error('The .forestadmin-schema.json file is empty.');
            logger.error('The schema cannot be synchronized with Forest Admin servers.');
            return;
          }
          const contentParsed = JSON.parse(content.toString());
          collectionsSent = contentParsed.collections;
          metaSent = contentParsed.meta;
        } catch (error) {
          if (error.code === 'ENOENT') {
            logger.error('The .forestadmin-schema.json file does not exists.');
          } else {
            logger.error('The content of .forestadmin-schema.json file is not a correct JSON.');
          }
          logger.error('The schema cannot be synchronized with Forest Admin servers.');
          return;
        }
      }

      if (DISABLE_AUTO_SCHEMA_APPLY) { return; }

      const schemaSent = schemaSerializer.perform(collectionsSent, metaSent);
      new ApimapSender(opts.envSecret, schemaSent).perform();
    })
    .then(() => ipWhitelist
      .retrieve(opts.envSecret)
      // NOTICE: An error log (done by the service) is enough in case of retrieval error.
      .catch(() => {}))
    .catch((error) => {
      logger.error('An error occured while computing the Forest schema. Your application schema ' +
        'cannot be synchronized with Forest. Your admin panel might not reflect your application ' +
        'models definition.', error);
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
};

exports.logger = require('./services/logger');
exports.StatSerializer = require('./serializers/stat');
exports.ResourceSerializer = require('./serializers/resource');
exports.ResourceDeserializer = require('./deserializers/resource');
exports.BaseFiltersParser = require('./services/base-filters-parser');
exports.BaseOperatorDateParser = require('./services/base-operator-date-parser');

exports.RecordsGetter = require('./services/exposed/records-getter');
exports.RecordsCounter = require('./services/exposed/records-counter');
exports.RecordsExporter = require('./services/exposed/records-exporter');
exports.RecordGetter = require('./services/exposed/record-getter');
exports.RecordUpdater = require('./services/exposed/record-updater');
exports.RecordCreator = require('./services/exposed/record-creator');
exports.RecordRemover = require('./services/exposed/record-remover');
exports.PermissionMiddlewareCreator = require('./middlewares/permissions');
