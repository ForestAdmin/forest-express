const P = require('bluebird');
const _ = require('lodash');
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('express-jwt');
const requireAll = require('require-all');
const context = require('./context');
const auth = require('./services/auth');

const ResourcesRoutes = require('./routes/resources');
const ActionsRoutes = require('./routes/actions');
const AssociationsRoutes = require('./routes/associations');
const StatRoutes = require('./routes/stats');
const SessionRoute = require('./routes/sessions');
const ForestRoutes = require('./routes/forest');
const HealthCheckRoute = require('./routes/healthcheck');
const Schemas = require('./generators/schemas');
const SchemaSerializer = require('./serializers/schema');
const Integrator = require('./integrations');
const SchemaFileUpdater = require('./services/schema-file-updater');
const ConfigStore = require('./services/config-store');
const ProjectDirectoryUtils = require('./utils/project-directory');
const { is2FASaltValid } = require('./utils/token-checker');
const { getJWTConfiguration } = require('./config/jwt');

const {
  logger,
  pathService,
  errorHandler,
  ipWhitelist,
  apimapFieldsFormater,
  apimapSender,
} = context.inject();

const pathProjectAbsolute = new ProjectDirectoryUtils().getAbsolutePath();

const ENVIRONMENT_DEVELOPMENT = !process.env.NODE_ENV
  || ['dev', 'development'].includes(process.env.NODE_ENV);
const SCHEMA_FILENAME = `${pathProjectAbsolute}/.forestadmin-schema.json`;
const DISABLE_AUTO_SCHEMA_APPLY = process.env.FOREST_DISABLE_AUTO_SCHEMA_APPLY
  && JSON.parse(process.env.FOREST_DISABLE_AUTO_SCHEMA_APPLY);
const REGEX_COOKIE_SESSION_TOKEN = /forest_session_token=([^;]*)/;
const TWO_FA_SECRET_SALT = process.env.FOREST_2FA_SECRET_SALT;
const configStore = ConfigStore.getInstance();

let jwtAuthenticator;

function getModels() {
  const models = configStore.Implementation.getModels();
  _.each(models, (model, modelName) => {
    model.modelName = modelName;
  });

  return _.values(models);
}

function requireAllModels(modelsDir) {
  if (modelsDir) {
    try {
      const isJavascriptOrTypescriptFileName = (fileName) =>
        fileName.endsWith('.js') || (fileName.endsWith('.ts') && !fileName.endsWith('.d.ts'));

      // NOTICE: Ends with `.spec.js`, `.spec.ts`, `.test.js` or `.test.ts`.
      const isTestFileName = (fileName) => fileName.match(/(?:\.test|\.spec)\.(?:js||ts)$/g);

      requireAll({
        dirname: modelsDir,
        excludeDirs: /^__tests__$/,
        filter: (fileName) =>
          isJavascriptOrTypescriptFileName(fileName) && !isTestFileName(fileName),
        recursive: true,
      });
    } catch (error) {
      logger.error('Cannot read a file for the following reason: ', error);
    }
  }

  // NOTICE: User didn't provide a modelsDir but may already have required them manually so they
  //         might be available.
  return P.resolve(getModels())
    .catch((error) => {
      logger.error('Cannot read a file for the following reason: ', error);
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

async function buildSchema() {
  const { lianaOptions, Implementation } = configStore;
  const absModelDirs = configStore.modelsDir ? path.resolve('.', configStore.modelsDir) : undefined;
  const models = await requireAllModels(absModelDirs);
  configStore.integrator = new Integrator(lianaOptions, Implementation);
  await Schemas.perform(
    Implementation,
    configStore.integrator,
    models,
    lianaOptions,
  );
  return models;
}

function generateAndSendSchema(opts) {
  if (!opts.envSecret) { return; }

  if (opts.envSecret.length !== 64) {
    logger.error('Your envSecret does not seem to be correct. Can you check on Forest that you copied it properly in the Forest initialization?');
    return;
  }

  const collections = _.values(Schemas.schemas);
  configStore.integrator.defineCollections(collections);

  collections
    .filter((collection) => collection.actions && collection.actions.length)
    // NOTICE: Check each Smart Action declaration to detect configuration errors.
    .forEach((collection) => {
      const isFieldsInvalid = (action) => action.fields && !Array.isArray(action.fields);
      collection.actions.forEach((action) => {
        if (!action.name) {
          logger.warn(`An unnamed Smart Action of collection "${collection.name}" has been ignored.`);
        } else if (isFieldsInvalid(action)) {
          logger.error(`Cannot find the fields you defined for the Smart action "${action.name}" of your "${collection.name}" collection. The fields option must be an array.`);
        }
      });
      // NOTICE: Ignore actions without a name.
      collection.actions = collection.actions.filter((action) => action.name);
    });

  const schemaSerializer = new SchemaSerializer();
  const { options: serializerOptions } = schemaSerializer;
  let collectionsSent;
  let metaSent;

  if (ENVIRONMENT_DEVELOPMENT) {
    const expressVersion = process.env.npm_package_dependencies_express;
    const meta = {
      database_type: configStore.Implementation.getDatabaseType(),
      liana: configStore.Implementation.getLianaName(),
      liana_version: configStore.Implementation.getLianaVersion(),
      engine: 'nodejs',
      engine_version: process.versions && process.versions.node,
      framework: expressVersion ? 'express' : 'other',
      framework_version: expressVersion,
      orm_version: configStore.Implementation.getOrmVersion(),
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
        logger.error('The .forestadmin-schema.json file does not exist.');
      } else {
        logger.error('The content of .forestadmin-schema.json file is not a correct JSON.');
      }
      logger.error('The schema cannot be synchronized with Forest Admin servers.');
      return;
    }
  }

  if (DISABLE_AUTO_SCHEMA_APPLY) { return; }

  const schemaSent = schemaSerializer.perform(collectionsSent, metaSent);
  apimapSender.send(opts.envSecret, schemaSent);
}

exports.init = async (Implementation) => {
  const { opts } = Implementation;

  configStore.Implementation = Implementation;
  configStore.lianaOptions = opts;

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
    logger.warn('DEPRECATION WARNING: The use of secretKey and authKey options is deprecated. Please use envSecret and authSecret instead.');
    opts.envSecret = opts.secretKey;
    opts.authSecret = opts.authKey;
  }

  if (TWO_FA_SECRET_SALT) {
    try {
      is2FASaltValid(TWO_FA_SECRET_SALT);
    } catch (error) {
      logger.warn(error.message);
    }
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
    jwtAuthenticator = jwt(getJWTConfiguration({
      secret: opts.authSecret,
      getToken: (request) => {
        if (request.headers) {
          if (request.headers.authorization
            && request.headers.authorization.split(' ')[0] === 'Bearer') {
            return request.headers.authorization.split(' ')[1];
          }
          // NOTICE: Necessary for downloads authentication.
          if (request.headers.cookie) {
            const match = request.headers.cookie.match(REGEX_COOKIE_SESSION_TOKEN);
            if (match && match[1]) {
              return match[1];
            }
          }
        }
        return null;
      },
    }));
  } else {
    logger.error('Your Forest authSecret seems to be missing. Can you check that you properly set a Forest authSecret in the Forest initializer?');
  }

  if (!opts.envSecret) {
    logger.error('Your Forest envSecret seems to be missing. Can you check that you properly set a Forest envSecret in the Forest initializer?');
  }

  if (jwtAuthenticator) {
    const pathsPublic = [/^\/forest\/sessions.*$/];
    app.use(pathMounted, jwtAuthenticator.unless({ path: pathsPublic }));
  }

  new HealthCheckRoute(app, opts).perform();
  new SessionRoute(app, opts).perform();

  // Init
  try {
    const models = await buildSchema();

    let directorySmartImplementation;

    if (opts.configDir) {
      directorySmartImplementation = path.resolve('.', opts.configDir);
    } else {
      directorySmartImplementation = `${path.resolve('.')}/forest`;
    }

    if (fs.existsSync(directorySmartImplementation)) {
      await requireAllModels(directorySmartImplementation);
    } else if (opts.configDir) {
      logger.error('The Forest configDir option you configured does not seem to be an existing directory.');
    }

    models.forEach((model) => {
      const modelName = configStore.Implementation.getModelName(model);

      configStore.integrator.defineRoutes(app, model, configStore.Implementation);

      const resourcesRoute = new ResourcesRoutes(app, model);
      resourcesRoute.perform();
      exports.ResourcesRoute[modelName] = resourcesRoute;

      new AssociationsRoutes(
        app,
        model,
        configStore.Implementation,
        configStore.integrator,
        configStore.lianaOptions,
      ).perform();
      new ActionsRoutes(
        app,
        model,
        configStore.Implementation,
        configStore.integrator,
        configStore.lianaOptions,
      ).perform();
      new StatRoutes(
        app,
        model,
        configStore.Implementation,
        configStore.lianaOptions,
      ).perform();
    });

    new ForestRoutes(app, configStore.lianaOptions).perform();

    app.use(pathMounted, errorHandler({ logger }));

    generateAndSendSchema(opts);
    try {
      await ipWhitelist.retrieve(opts.envSecret);
    } catch (error) {
      // NOTICE: An error log (done by the service) is enough in case of retrieval error.
    }

    if (opts.expressParentApp) {
      opts.expressParentApp.use('/forest', app);
    }

    return app;
  } catch (error) {
    logger.error('An error occured while computing the Forest schema. Your application schema cannot be synchronized with Forest. Your admin panel might not reflect your application models definition. ', error);
    throw error;
  }
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
    opts.fields = apimapFieldsFormater.formatFieldsByCollectionName(opts.fields, name);
    Schemas.schemas[name].fields = _.concat(opts.fields, Schemas.schemas[name].fields);

    if (opts.searchFields) {
      Schemas.schemas[name].searchFields = opts.searchFields;
    }
  } else if (opts.fields && opts.fields.length) {
    // NOTICE: Smart Collection definition case
    opts.name = name;
    opts.idField = 'id';
    opts.isVirtual = true;
    opts.isSearchable = !!opts.isSearchable;
    opts.fields = apimapFieldsFormater.formatFieldsByCollectionName(opts.fields, name);
    Schemas.schemas[name] = opts;
  }
};

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
exports.RecordsRemover = require('./services/exposed/records-remover');
exports.RecordSerializer = require('./services/exposed/record-serializer');
exports.PermissionMiddlewareCreator = require('./middlewares/permissions');

exports.errorHandler = errorHandler;

exports.PUBLIC_ROUTES = ['/', '/healthcheck', '/sessions', '/sessions-google'];
