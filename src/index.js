
const P = require('bluebird');
const _ = require('lodash');
const express = require('express');
const path = require('path');
const fs = require('fs');

const readdirAsync = P.promisify(fs.readdir);
const cors = require('express-cors');
const bodyParser = require('body-parser');
const jwt = require('express-jwt');
const ResourcesRoutes = require('./routes/resources');
const AssociationsRoutes = require('./routes/associations');
const StatRoutes = require('./routes/stats');
const SessionRoute = require('./routes/sessions');
const ForestRoutes = require('./routes/forest');
const Schemas = require('./generators/schemas');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const logger = require('./services/logger');
const Integrator = require('./integrations');
const errorHandler = require('./services/error-handler');
const codeSyntaxInspector = require('./utils/code-syntax-inspector');
const ApimapSender = require('./services/apimap-sender');

function getModels(Implementation) {
  const models = Implementation.getModels();
  _.each(models, (model, modelName) => {
    model.modelName = modelName;
  });

  return _.values(models);
}

function requireAllModels(Implementation, modelsDir, displayMessage) {
  if (modelsDir) {
    return readdirAsync(modelsDir)
      .each((file) => {
        try {
          if (file.endsWith('.js') || (file.endsWith('.ts') && !file.endsWith('.d.ts'))) {
            if (fs.statSync(path.join(modelsDir, file)).isFile()) {
              require(path.join(modelsDir, file));
            }
          }
        } catch (error) {
          if (displayMessage) {
            logger.error(`Cannot read your model in the file ${file
            } for the following reason: `, error);
          }
        }
      })
      .then(() => getModels(Implementation))
      .catch((error) => {
        if (displayMessage) {
          if (error.code === 'ENOENT') {
            logger.error('Your Forest modelsDir option you configured does ' +
              'not seem to be an existing directory.');
          } else {
            logger.error(`Cannot read your models for the following reason: ${
              error.message}`, error);
          }
        }
        return P.resolve([]);
      });
  }
  // NOTICE: User didn't provide a modelsDir but may already have required
  // them manually so they might be available.
  return P.resolve(getModels(Implementation));
}

function getFields(opts) {
  return _.map(opts.fields, (field) => {
    field.isVirtual = true;
    field.isFilterable = field.isFilterable || false;
    field.isSortable = field.isSortable || false;
    field.isReadOnly = !field.set;

    return field;
  });
}

exports.Schemas = Schemas;
exports.logger = logger;
exports.ResourcesRoute = {};

exports.init = function (Implementation) {
  const opts = Implementation.opts;
  const app = express();
  let integrator;

  if (opts.secretKey) {
    logger.warn('DEPRECATION WARNING: The use of secretKey and authKey options ' +
    'is deprecated. Please use envSecret and authSecret instead.');
    opts.envSecret = opts.secretKey;
    opts.authSecret = opts.authKey;
  }

  // CORS
  let allowedOrigins = ['localhost:4200', '*.forestadmin.com'];

  if (process.env.CORS_ORIGINS) {
    allowedOrigins = allowedOrigins.concat(process.env.CORS_ORIGINS.split(','));
  }

  app.use(cors({
    allowedOrigins,
    headers: ['Authorization', 'X-Requested-With', 'Content-Type'],
  }));

  // Mime type
  app.use(bodyParser.json());

  let jwtAuthenticator;

  // Authentication
  if (opts.authSecret) {
    jwtAuthenticator = jwt({
      secret: opts.authSecret,
      credentialsRequired: false,
      getToken(request) {
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
  requireAllModels(Implementation, absModelDirs, true)
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

          return codeSyntaxInspector
            .extractCodeSyntaxErrorInDirectoryFile(directorySmartImplementation)
            .then((hasError) => {
              if (hasError) {
                throw new Error();
              } else {
                // NOTICE: Do not display an error log if the forest/ directory
                //         does not exist.
                return requireAllModels(
                  Implementation,
                  directorySmartImplementation, false,
                );
              }
            });
        })
        .thenReturn(models);
    })
    .each((model) => {
      const modelName = Implementation.getModelName(model);

      integrator.defineRoutes(app, model, Implementation);

      const resourcesRoute = new ResourcesRoutes(
        app, model, Implementation,
        integrator, opts,
      );
      resourcesRoute.perform();
      exports.ResourcesRoute[modelName] = resourcesRoute;

      new AssociationsRoutes(app, model, Implementation, integrator, opts)
        .perform();

      new StatRoutes(app, model, Implementation, opts).perform();
    })
    .then(() => {
      new ForestRoutes(app, opts).perform();
    })
    .then(() => {
      app.use(errorHandler.catchIfAny);
    })
    .then(() => {
      if (opts.envSecret && opts.envSecret.length !== 64) {
        logger.error('Your envSecret does not seem to be correct. Can you ' +
          'check on Forest that you copied it properly in the Forest ' +
          'initialization?');
      } else if (opts.envSecret) {
        const collections = _.values(Schemas.schemas);
        integrator.defineCollections(collections);

        // NOTICE: Check each Smart Action declaration to detect configuration
        //         errors.
        _.each(collections, (collection) => {
          if (collection.actions) {
            _.each(collection.actions, (action) => {
              if (action.fields && !_.isArray(action.fields)) {
                logger.error(`${'Cannot find the fields you defined for the ' +
                    'Smart action "'}${action.name}" of your "${
                  collection.name}" collection. The fields option must ` +
                    'be an array.');
              }
            });
          }
        });

        const apimap = new JSONAPISerializer('collections', collections, {
          id: 'name',
          // TODO: Remove nameOld attribute once the lianas versions older than 2.0.0 are minority.
          attributes: ['name', 'nameOld', 'displayName', 'paginationType', 'icon',
            'fields', 'actions', 'segments', 'onlyForRelationships',
            'isVirtual', 'integration', 'isReadOnly', 'isSearchable'],
          fields: {
            attributes: ['field', 'displayName', 'type', 'enums',
              'collection_name', 'reference', 'column', 'isFilterable',
              'widget', 'integration', 'isReadOnly', 'isVirtual',
              'isRequired', 'defaultValue', 'validations', 'isSortable'],
          },
          validations: {
            attributes: ['type', 'value', 'message'],
          },
          actions: {
            ref: 'id',
            attributes: ['name', 'endpoint', 'redirect', 'download', 'global',
              'httpMethod', 'fields'],
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

exports.collection = function (name, opts) {
  if (_.isEmpty(Schemas.schemas) && opts.modelsDir) {
    logger.error(`Cannot customize your collection named "${name
    }" properly. Did you call the "collection" method in the /forest ` +
      'directory?');
    return;
  }

  let collection = _.find(Schemas.schemas, { name });

  if (!collection) {
    collection = _.find(Schemas.schemas, { nameOld: name });
    if (collection) {
      name = collection.name;
      logger.warn(`${'DEPRECATION WARNING: Collection names are now based on the models ' +
        'names. Please rename the collection "'}${collection.nameOld}" of your Forest ` +
        `customisation in "${collection.name}".`);
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
    opts.fields = getFields(opts);
    Schemas.schemas[name].fields = _.concat(
      opts.fields,
      Schemas.schemas[name].fields,
    );

    if (opts.searchFields) {
      Schemas.schemas[name].searchFields = opts.searchFields;
    }
  } else {
    // NOTICE: Smart Collection definition case
    opts.name = name;
    opts.isVirtual = true;
    opts.isSearchable = !!opts.isSearchable;
    opts.fields = getFields(opts);
    Schemas.schemas[name] = opts;
  }
};

exports.logger = require('./services/logger');
exports.ensureAuthenticated = require('./services/auth').ensureAuthenticated;
exports.StatSerializer = require('./serializers/stat');
exports.ResourceSerializer = require('./serializers/resource');
exports.ResourceDeserializer = require('./deserializers/resource');
