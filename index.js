'use strict';
var P = require('bluebird');
var _ = require('lodash');
var express = require('express');
var path = require('path');
var fs = require('fs');
var readdirAsync = P.promisify(fs.readdir);
var cors = require('cors');
var bodyParser = require('body-parser');
var jwt = require('express-jwt');
var auth = require('./services/auth');
var ResourcesRoutes = require('./routes/resources');
var ActionsRoutes = require('./routes/actions');
var AssociationsRoutes = require('./routes/associations');
var StatRoutes = require('./routes/stats');
var SessionRoute = require('./routes/sessions');
var ForestRoutes = require('./routes/forest');
var Schemas = require('./generators/schemas');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var logger = require('./services/logger');
var Integrator = require('./integrations');
var errorHandler = require('./services/error-handler');
var ApimapSender = require('./services/apimap-sender');
var ipWhitelist = require('./services/ip-whitelist');

var jwtAuthenticator;

function getModels(Implementation) {
  var models = Implementation.getModels();
  _.each(models, function (model, modelName) {
    model.modelName = modelName;
  });

  return _.values(models);
}

function requireAllModels(Implementation, modelsDir) {
  if (modelsDir) {
    return readdirAsync(modelsDir)
      .each(function (file) {
        try {
          if (file.endsWith('.js') || (file.endsWith('.ts') && !file.endsWith('.d.ts'))) {
            if (fs.statSync(path.join(modelsDir, file)).isFile()) {
              require(path.join(modelsDir, file));
            }
          }
        } catch (error) {
          logger.error('Cannot read your model in the file ' + file +
            ' for the following reason: ', error);
        }
      })
      .then(function () {
        return getModels(Implementation);
      })
      .catch(function (error) {
        logger.error('Cannot read your models for the following reason: ' + error.message, error);
        return P.resolve([]);
      });
  } else {
    // NOTICE: User didn't provide a modelsDir but may already have required
    // them manually so they might be available.
    return P.resolve(getModels(Implementation));
  }
}

function getFields(opts) {
  return _.map(opts.fields, function (field) {
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

exports.ensureAuthenticated = function (request, response, next) {
  auth.authenticate(request, response, next, jwtAuthenticator);
};

exports.init = function (Implementation, dependencies) {
  var opts = Implementation.opts;
  var app = express();
  var integrator;

  dependencies = dependencies || {};
  auth.initAuth(opts);

  if (opts.secretKey) {
    logger.warn('DEPRECATION WARNING: The use of secretKey and authKey options ' +
    'is deprecated. Please use envSecret and authSecret instead.');
    opts.envSecret = opts.secretKey;
    opts.authSecret = opts.authKey;
  }

  // CORS
  var allowedOrigins = ['localhost:4200', /\.forestadmin\.com$/];

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
      getToken: function (request) {
        if (request.headers && request.headers.authorization &&
          request.headers.authorization.split(' ')[0] === 'Bearer') {
          return request.headers.authorization.split(' ')[1];
        } else if (request.query && request.query.sessionToken) {
          return request.query.sessionToken;
        }
        return null;
      }
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

  new SessionRoute(app, opts, dependencies).perform();

  // Init
  var absModelDirs = opts.modelsDir ? path.resolve('.', opts.modelsDir) : undefined;
  requireAllModels(Implementation, absModelDirs)
    .then(function (models) {
      integrator = new Integrator(opts, Implementation);

      return Schemas.perform(Implementation, integrator, models, opts)
        .then(function () {
          var directorySmartImplementation;

          if (opts.configDir) {
            directorySmartImplementation = path.resolve('.', opts.configDir);
          } else {
            directorySmartImplementation = path.resolve('.') + '/forest';
          }

          if (fs.existsSync(directorySmartImplementation)) {
            return requireAllModels(Implementation, directorySmartImplementation);
          } else {
            if (opts.configDir) {
              logger.error('The Forest modelsDir option you configured does not seem to be an existing directory.');
            }
            return [];
          }
        })
        .thenReturn(models);
    })
    .each(function (model) {
      var modelName = Implementation.getModelName(model);

      integrator.defineRoutes(app, model, Implementation);

      var resourcesRoute = new ResourcesRoutes(app, model, Implementation,
        integrator, opts);
      resourcesRoute.perform();
      exports.ResourcesRoute[modelName] = resourcesRoute;

      new AssociationsRoutes(app, model, Implementation, integrator, opts).perform();
      new ActionsRoutes(app, model, Implementation, integrator, opts).perform();

      new StatRoutes(app, model, Implementation, opts).perform();
    })
    .then(function () {
      new ForestRoutes(app, opts).perform();
    })
    .then(function () {
      app.use(errorHandler.catchIfAny);
    })
    .then(function () {
      if (opts.envSecret && opts.envSecret.length !== 64) {
        logger.error('Your envSecret does not seem to be correct. Can you ' +
          'check on Forest that you copied it properly in the Forest ' +
          'initialization?');
      } else {
        if (opts.envSecret) {
          var collections = _.values(Schemas.schemas);
          integrator.defineCollections(collections);

          // NOTICE: Check each Smart Action declaration to detect configuration
          //         errors.
          _.each(collections, function (collection) {
            if (collection.actions) {
              _.each(collection.actions, function (action) {
                if (action.fields && !_.isArray(action.fields)) {
                  logger.error('Cannot find the fields you defined for the ' +
                    'Smart action "' + action.name + '" of your "' +
                    collection.name + '" collection. The fields option must ' +
                    'be an array.');
                }
              });
            }
          });

          var apimap = new JSONAPISerializer('collections', collections, {
            id: 'name',
            // TODO: Remove nameOld attribute once the lianas versions older than 2.0.0 are minority.
            attributes: ['name', 'nameOld', 'displayName', 'paginationType', 'icon',
              'fields', 'actions', 'segments', 'onlyForRelationships',
              'isVirtual', 'integration', 'isReadOnly','isSearchable'],
            fields: {
              attributes: ['field', 'displayName', 'type', 'enums',
                'collection_name', 'reference', 'column', 'isFilterable',
                'widget', 'integration', 'isReadOnly', 'isVirtual',
                'isRequired', 'defaultValue', 'validations', 'isSortable']
            },
            validations: {
              attributes: ['type', 'value', 'message']
            },
            actions: {
              ref: 'id',
              attributes: ['name', 'baseUrl', 'endpoint', 'redirect', 'download', 'global', 'type',
                'httpMethod', 'fields'] // TODO: Remove global attribute when we remove the deprecation warning.
            },
            segments: {
              ref: 'id',
              attributes: ['name']
            },
            meta: {
              'liana': Implementation.getLianaName(),
              'liana_version': Implementation.getLianaVersion(),
              'orm_version': Implementation.getOrmVersion(),
              'database_type': Implementation.getDatabaseType(),
            }
          });

          if (dependencies.ApimapSender) {
            ApimapSender = dependencies.ApimapSender;
          }
          new ApimapSender(opts.envSecret, apimap).perform();
        }
      }
    })
    .then(function () {
      return ipWhitelist
        .retrieve(opts.envSecret)
        .catch(error => logger.error(error));
    })
    .catch(function (error) {
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
    logger.error('Cannot customize your collection named "' + name +
      '" properly. Did you call the "collection" method in the /forest ' +
      'directory?');
    return;
  }

  var collection = _.find(Schemas.schemas, { name: name });

  if (!collection) {
    collection = _.find(Schemas.schemas, { nameOld: name });
    if (collection) {
      name = collection.name;
      logger.warn('DEPRECATION WARNING: Collection names are now based on the models ' +
        'names. Please rename the collection "' + collection.nameOld + '" of your Forest ' +
        'customisation in "' + collection.name + '".');
    }
  }

  // NOTICE: Action ids are defined concatenating the collection name and the
  //         action name to prevent action id conflicts between collections.
  _.each(opts.actions, function (action) {
    action.id = name + '.' + action.name;
  });

  _.each(opts.segments, function (segment) {
    segment.id = name + '.' + segment.name;
  });

  if (collection) {
    if (!Schemas.schemas[name].actions) { Schemas.schemas[name].actions = []; }
    if (!Schemas.schemas[name].segments) { Schemas.schemas[name].segments = []; }

    Schemas.schemas[name].actions = _.union(opts.actions, Schemas.schemas[name].actions);

    _.each(Schemas.schemas[name].actions, function (action) {
      if (action.global) {
        logger.warn('DEPRECATION WARNING: Smart Action "global" option is now deprecated. ' +
          'Please set "type: \'global\'" instead of "global: true" for the "' + action.name +
          '" Smart Action.');
      }

      if (action.type && !_.includes(['bulk', 'global', 'single'], action.type)) {
        logger.warn('Please set a valid Smart Action type ("bulk", "global" or "single") for the "' +
          action.name + '" Smart Action.');
      }

      // NOTICE: Set a position to the Smart Actions fields.
      _.each(action.fields, function (field, position) {
        field.position = position;
      });
    });

    Schemas.schemas[name].segments = _.union(opts.segments, Schemas.schemas[name].segments);

    // NOTICE: Smart Field definition case
    opts.fields = getFields(opts);
    Schemas.schemas[name].fields = _.concat(opts.fields,
      Schemas.schemas[name].fields);

    if (opts.searchFields) {
      Schemas.schemas[name].searchFields = opts.searchFields;
    }
  } else {
    // NOTICE: Smart Collection definition case
    opts.name = name;
    opts.idField = 'id';
    opts.isVirtual = true;
    opts.isSearchable = !!opts.isSearchable;
    opts.fields = getFields(opts);
    Schemas.schemas[name] = opts;
  }
};

exports.logger = require('./services/logger');
exports.StatSerializer = require('./serializers/stat');
exports.ResourceSerializer = require('./serializers/resource');
exports.ResourceDeserializer = require('./deserializers/resource');
