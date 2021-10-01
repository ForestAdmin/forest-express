const _ = require('lodash');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('express-jwt');
const url = require('url');
const requireAll = require('require-all');
const context = require('./context');
const initContext = require('./context/init');

context.init(initContext);

const auth = require('./services/auth');

const ResourcesRoutes = require('./routes/resources');
const ActionsRoutes = require('./routes/actions');
const AssociationsRoutes = require('./routes/associations');
const StatRoutes = require('./routes/stats');
const ForestRoutes = require('./routes/forest');
const HealthCheckRoute = require('./routes/healthcheck');
const initScopeRoutes = require('./routes/scopes');
const Schemas = require('./generators/schemas');
const SchemaSerializer = require('./serializers/schema');
const Integrator = require('./integrations');
const { getJWTConfiguration } = require('./config/jwt');
const initAuthenticationRoutes = require('./routes/authentication');

const {
  logger,
  path,
  pathService,
  errorHandler,
  ipWhitelist,
  apimapFieldsFormater,
  apimapSender,
  schemaFileUpdater,
  configStore,
  modelsManager,
  fs,
  tokenService,
  scopeManager,
  smartActionFieldValidator,
} = context.inject();

const PUBLIC_ROUTES = [
  '/',
  '/healthcheck',
  ...initAuthenticationRoutes.PUBLIC_ROUTES,
];

const ENVIRONMENT_DEVELOPMENT = !process.env.NODE_ENV
  || ['dev', 'development'].includes(process.env.NODE_ENV);
const DISABLE_AUTO_SCHEMA_APPLY = process.env.FOREST_DISABLE_AUTO_SCHEMA_APPLY
  && JSON.parse(process.env.FOREST_DISABLE_AUTO_SCHEMA_APPLY);

let jwtAuthenticator;
let app = null;

function loadCollections(collectionsDir) {
  const isJavascriptOrTypescriptFileName = (fileName) =>
    fileName.endsWith('.js') || (fileName.endsWith('.ts') && !fileName.endsWith('.d.ts'));

  // NOTICE: Ends with `.spec.js`, `.spec.ts`, `.test.js` or `.test.ts`.
  const isTestFileName = (fileName) => fileName.match(/(?:\.test|\.spec)\.(?:js||ts)$/g);

  requireAll({
    dirname: collectionsDir,
    excludeDirs: /^__tests__$/,
    filter: (fileName) =>
      isJavascriptOrTypescriptFileName(fileName) && !isTestFileName(fileName),
    recursive: true,
  });
}

async function buildSchema() {
  const { lianaOptions, Implementation } = configStore;
  const models = Object.values(modelsManager.getModels());
  configStore.integrator = new Integrator(lianaOptions, Implementation);
  await Schemas.perform(
    Implementation,
    configStore.integrator,
    models,
    lianaOptions,
  );
  return models;
}

exports.Schemas = Schemas;
exports.logger = logger;
exports.scopeManager = scopeManager;
exports.ResourcesRoute = {};

/**
 * @param {import('express').Request} request
 * @param {import('express').Response} response
 * @param {import('express').NextFunction} next
 */
exports.ensureAuthenticated = (request, response, next) => {
  const parsedUrl = url.parse(request.originalUrl);
  const forestPublicRoutes = PUBLIC_ROUTES.map((route) => `/forest${route}`);

  if (forestPublicRoutes.includes(parsedUrl.pathname)) {
    next();
    return;
  }

  auth.authenticate(request, response, next, jwtAuthenticator);
};

async function generateAndSendSchema(envSecret) {
  const collections = _.values(Schemas.schemas);
  configStore.integrator.defineCollections(collections);

  collections
    .filter((collection) => collection.actions && collection.actions.length)
    // NOTICE: Check each Smart Action declaration to detect configuration errors.
    .forEach((collection) => {
      collection.actions.forEach((action) => {
        if (!action.name) {
          logger.warn(`An unnamed Smart Action of collection "${collection.name}" has been ignored.`);
        } else {
          try {
            smartActionFieldValidator.validateSmartActionFields(action, collection.name);
          } catch (error) {
            logger.error(error.message);
          }
        }
      });
      // NOTICE: Ignore actions without a name.
      collection.actions = collection.actions.filter((action) => action.name);
    });

  const schemaSerializer = new SchemaSerializer();
  const { options: serializerOptions } = schemaSerializer;
  let collectionsSent;
  let metaSent;

  const pathSchemaFile = path.join(configStore.schemaDir, '.forestadmin-schema.json');

  if (ENVIRONMENT_DEVELOPMENT) {
    const meta = {
      liana: configStore.Implementation.getLianaName(),
      liana_version: configStore.Implementation.getLianaVersion(),
      stack: {
        database_type: configStore.Implementation.getDatabaseType(),
        engine: 'nodejs',
        engine_version: process.versions && process.versions.node,
        orm_version: configStore.Implementation.getOrmVersion(),
      },
    };
    const content = schemaFileUpdater.update(pathSchemaFile, collections, meta, serializerOptions);
    collectionsSent = content.collections;
    metaSent = content.meta;
  } else {
    try {
      const content = fs.readFileSync(pathSchemaFile);
      if (!content) {
        logger.error('The .forestadmin-schema.json file is empty.');
        logger.error('The schema cannot be synchronized with Forest Admin servers.');
        return Promise.resolve(null);
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
      return Promise.resolve(null);
    }
  }

  if (DISABLE_AUTO_SCHEMA_APPLY) { return Promise.resolve(); }

  const schemaSent = schemaSerializer.perform(collectionsSent, metaSent);

  const hash = crypto.createHash('sha1');
  const schemaHash = hash.update(JSON.stringify(schemaSent)).digest('hex');
  schemaSent.meta.schemaHash = schemaHash;

  return apimapSender.checkHash(envSecret, schemaHash)
    .then(({ body }) => {
      if (body.sendSchema) {
        logger.info('Sending apimap update to Forest...');
        return apimapSender.send(envSecret, schemaSent);
      }
      logger.info('No change in apimap, nothing sent to Forest.');
      return Promise.resolve(null);
    });
}

exports.init = async (Implementation) => {
  const { opts } = Implementation;

  configStore.Implementation = Implementation;
  configStore.lianaOptions = opts;

  if (app) {
    logger.warn('Forest init function called more than once. Only the first call has been processed.');
    return app;
  }

  app = express();

  try {
    configStore.validateOptions();
  } catch (error) {
    logger.error(error.message);
    return Promise.resolve(app);
  }

  const pathMounted = pathService.generateForInit('*', configStore.lianaOptions);

  auth.initAuth(configStore.lianaOptions);

  // CORS
  let allowedOrigins = ['localhost:4200', /\.forestadmin\.com$/];
  const oneDayInSeconds = 86400;

  if (process.env.CORS_ORIGINS) {
    allowedOrigins = allowedOrigins.concat(process.env.CORS_ORIGINS.split(','));
  }

  const corsOptions = {
    origin: allowedOrigins,
    maxAge: oneDayInSeconds,
    credentials: true,
    preflightContinue: true,
  };

  app.use(pathService.generate(initAuthenticationRoutes.CALLBACK_ROUTE, opts), cors({
    ...corsOptions,
    // this route needs to be called after a redirection
    // in this situation, the origin sent by the browser is "null"
    origin: ['null', ...corsOptions.origin],
  }));

  app.use(pathMounted, cors(corsOptions));

  // Mime type
  app.use(pathMounted, bodyParser.json());

  // Authentication
  if (configStore.lianaOptions.authSecret) {
    jwtAuthenticator = jwt(getJWTConfiguration({
      secret: configStore.lianaOptions.authSecret,
      getToken: (request) => {
        if (request.headers) {
          if (request.headers.authorization
            && request.headers.authorization.split(' ')[0] === 'Bearer') {
            return request.headers.authorization.split(' ')[1];
          }
          // NOTICE: Necessary for downloads authentication.
          if (request.headers.cookie) {
            const forestSessionToken = tokenService
              .extractForestSessionToken(request.headers.cookie);
            if (forestSessionToken) {
              return forestSessionToken;
            }
          }
        }
        return null;
      },
    }));
  }

  if (jwtAuthenticator) {
    const pathsPublic = [/^\/forest\/authentication$/, /^\/forest\/authentication\/.*$/];
    app.use(pathMounted, jwtAuthenticator.unless({ path: pathsPublic }));
  }

  new HealthCheckRoute(app, configStore.lianaOptions).perform();
  initScopeRoutes(app, context.inject());
  initAuthenticationRoutes(app, configStore.lianaOptions, context.inject());

  // Init
  try {
    const models = await buildSchema();

    if (configStore.doesConfigDirExist()) {
      loadCollections(configStore.configDir);
    }

    if (configStore?.Implementation?.Flattener) {
      app.use(configStore.Implementation.Flattener.requestUnflattener);
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
      new StatRoutes(
        app,
        model,
        configStore.Implementation,
        configStore.lianaOptions,
      ).perform();
    });

    const collections = _.values(Schemas.schemas);
    collections.forEach((collection) => {
      const retrievedModel = models.find((model) =>
        configStore.Implementation.getModelName(model) === collection.name);
      new ActionsRoutes().perform(
        app,
        collection,
        retrievedModel,
        configStore.Implementation,
        configStore.lianaOptions,
        auth,
      );
    });

    new ForestRoutes(app, configStore.lianaOptions).perform();

    app.use(pathMounted, errorHandler({ logger }));

    const generateAndSendSchemaPromise = generateAndSendSchema(configStore.lianaOptions.envSecret);
    // NOTICE: Hide promise for testing purpose. Waiting here in production
    //         will change app behaviour.
    if (process.env.NODE_ENV === 'test') {
      app._generateAndSendSchemaPromise = generateAndSendSchemaPromise;
    }

    try {
      await ipWhitelist.retrieve(configStore.lianaOptions.envSecret);
    } catch (error) {
      // NOTICE: An error log (done by the service) is enough in case of retrieval error.
    }

    if (configStore.lianaOptions.expressParentApp) {
      configStore.lianaOptions.expressParentApp.use('/forest', app);
    }

    return app;
  } catch (error) {
    logger.error('An error occured while computing the Forest schema. Your application schema cannot be synchronized with Forest. Your admin panel might not reflect your application models definition. ', error);
    throw error;
  }
};

function getSmartActionsUsingHTTPMethod(actions) {
  return actions.filter(
    (action) => Object.hasOwnProperty.call(action, 'httpMethod'),
  );
}

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

    // NOTICE: `httpMethod` on smart actions will be removed in the future.
    getSmartActionsUsingHTTPMethod(Schemas.schemas[name].actions)
      .forEach((action) => {
        const removeHttpMethodMessage = 'Please update your smart action route to use the POST verb instead, and remove the "httpMethod" property in your forest file.';

        if (['get', 'head'].includes(action.httpMethod.toLowerCase())) {
          logger.error(`The "httpMethod" ${action.httpMethod} of your smart action "${action.name}" is not supported. ${removeHttpMethodMessage}`);
        } else {
          logger.warn(`DEPRECATION WARNING: The "httpMethod" property of your smart action "${action.name}" is now deprecated. ${removeHttpMethodMessage}`);
        }
      });

    // NOTICE: Smart Field definition case
    opts.fields = apimapFieldsFormater.formatFieldsByCollectionName(opts.fields, name);
    Schemas.schemas[name].fields = _.concat(opts.fields, Schemas.schemas[name].fields);

    if (configStore?.Implementation?.Flattener) {
      const Flattener = new configStore.Implementation.Flattener(
        Schemas.schemas[name],
        opts.fieldsToFlatten,
      );
      Flattener.flattenFields();
    }

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

exports.SchemaSerializer = SchemaSerializer;
exports.StatSerializer = require('./serializers/stat');
exports.ResourceSerializer = require('./serializers/resource');
exports.ResourceDeserializer = require('./deserializers/resource');
exports.BaseFiltersParser = require('./services/base-filters-parser');
exports.BaseOperatorDateParser = require('./services/base-operator-date-parser');
exports.SchemaUtils = require('./utils/schema');

exports.RecordsGetter = require('./services/exposed/records-getter');
exports.RecordsCounter = require('./services/exposed/records-counter');
exports.RecordsExporter = require('./services/exposed/records-exporter');
exports.RecordGetter = require('./services/exposed/record-getter');
exports.RecordUpdater = require('./services/exposed/record-updater');
exports.RecordCreator = require('./services/exposed/record-creator');
exports.RecordRemover = require('./services/exposed/record-remover');
exports.RecordsRemover = require('./services/exposed/records-remover');
exports.RecordSerializer = require('./services/exposed/record-serializer');
exports.ScopeManager = require('./services/scope-manager');
exports.PermissionMiddlewareCreator = require('./middlewares/permissions');

exports.errorHandler = errorHandler;

exports.PUBLIC_ROUTES = PUBLIC_ROUTES;

if (process.env.NODE_ENV === 'test') {
  exports.generateAndSendSchema = generateAndSendSchema;
}
