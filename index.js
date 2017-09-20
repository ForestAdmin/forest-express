'use strict';
var P = require('bluebird');
var _ = require('lodash');
var express = require('express');
var path = require('path');
var fs = require('fs');
var readdirAsync = P.promisify(fs.readdir);
var cors = require('express-cors');
var bodyParser = require('body-parser');
var jwt = require('express-jwt');
var ResourcesRoutes = require('./routes/resources');
var AssociationsRoutes = require('./routes/associations');
var StatRoutes = require('./routes/stats');
var SessionRoute = require('./routes/sessions');
var ForestRoutes = require('./routes/forest');
var Schemas = require('./generators/schemas');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var request = require('superagent');
var logger = require('./services/logger');
var Integrator = require('./integrations');
var errorHandler = require('./services/error-handler');
var codeSyntaxInspector = require('./utils/code-syntax-inspector');

function requireAllModels(Implementation, modelsDir, displayMessage) {
  if (modelsDir) {
    return readdirAsync(modelsDir)
      .each(function (file) {
        try {
          if (fs.statSync(path.join(modelsDir, file)).isFile()) {
            require(path.join(modelsDir, file));
          }
        } catch (error) {
          if (displayMessage) {
            logger.error('Cannot read your model in the file ' + file +
              ' for the following reason: ', error);
          }
        }
      })
      .then(function () {
        return _.values(Implementation.getModels());
      })
      .catch(function (error) {
        if (displayMessage) {
          if (error.code === 'ENOENT') {
            logger.error('Your Forest modelsDir option you configured does ' +
              'not seem to be an existing directory.');
          } else {
            logger.error('Cannot read your models for the following reason: ' +
              error.message, error);
          }
        }
        return P.resolve([]);
      });
  } else {
    // NOTICE: User didn't provide a modelsDir but may already have required
    // them manually so they might be available.
    return P.resolve(_.values(Implementation.getModels()));
  }
}

function getFields(opts) {
  return _.map(opts.fields, function (field) {
    field.isVirtual = true;
    field.isSearchable = false;
    field.isSortable = field.isSortable || false;
    field.isReadOnly = !field.set;

    return field;
  });
}

exports.Schemas = Schemas;
exports.logger = logger;
exports.ResourcesRoute = {};

exports.init = function (Implementation) {
  var opts = Implementation.opts;
  var app = express();
  var integrator = new Integrator(opts, Implementation);

  if (opts.secretKey) {
    logger.warn('DEPRECATION WARNING: The use of secretKey and authKey options ' +
    'is deprecated. Please use envSecret and authSecret instead.');
    opts.envSecret = opts.secretKey;
    opts.authSecret = opts.authKey;
  }

  // CORS
  app.use(cors({
    allowedOrigins: ['localhost:4200', '*.forestadmin.com'],
    headers: ['Authorization', 'X-Requested-With', 'Content-Type']
  }));

  // Mime type
  app.use(bodyParser.json());

  var jwtAuthenticator;

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

  new SessionRoute(app, opts).perform();

  // Init
  var absModelDirs = opts.modelsDir ? path.resolve('.', opts.modelsDir) : undefined;
  requireAllModels(Implementation, absModelDirs, true)
    .then(function (models) {
      return Schemas.perform(Implementation, integrator, models, opts)
        .then(function () {
          var directorySmartImplementation;

          if (opts.configDir) {
            directorySmartImplementation = path.resolve('.', opts.configDir);
          } else {
            directorySmartImplementation = path.resolve('.') + '/forest';
          }

          return codeSyntaxInspector
            .extractCodeSyntaxErrorInDirectoryFile(directorySmartImplementation)
            .then(function (hasError) {
              if (hasError) {
                throw new Error();
              } else {
                // NOTICE: Do not display an error log if the forest/ directory
                //         does not exist.
                return requireAllModels(Implementation,
                  directorySmartImplementation, false);
              }
            });
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

      new AssociationsRoutes(app, model, Implementation, integrator, opts)
        .perform();

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
            attributes: ['name', 'displayName', 'paginationType', 'icon',
              'fields', 'actions', 'segments', 'onlyForRelationships',
              'isVirtual', 'integration', 'isReadOnly','isSearchable'],
            fields: {
              attributes: ['field', 'displayName', 'type', 'enums',
                'collection_name', 'reference', 'column', 'isSearchable',
                'widget', 'integration', 'isReadOnly', 'isVirtual',
                'isRequired', 'defaultValue', 'validations', 'isSortable']
            },
            validations: {
              attributes: ['type', 'value', 'message']
            },
            actions: {
              ref: 'id',
              attributes: ['name', 'endpoint', 'redirect', 'download', 'global',
                'httpMethod', 'fields']
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

          var forestUrl = process.env.FOREST_URL ||
            'https://forestadmin-server.herokuapp.com';

          request
            .post(forestUrl + '/forest/apimaps')
              .send(apimap)
              .set('forest-secret-key', opts.envSecret)
              .end(function (error, result) {
                if (result) {
                  if ([200, 202, 204].indexOf(result.status) !== -1) {
                    if (result.body && result.body.warning) {
                      logger.warn(result.body.warning);
                    }
                  } else if (result.status === 0) {
                    logger.warn('Cannot send the apimap to Forest. Are you ' +
                      'online?');
                  } else if (result.status === 404) {
                    logger.error('Cannot find the project related to the ' +
                      'envSecret you configured. Can you check on Forest ' +
                      'that you copied it properly in the Forest ' +
                      'initialization?');
                  } else if (result.status === 503) {
                    logger.warn('Forest is in maintenance for a few minutes. ' +
                      'We are upgrading your experience in the forest. We ' +
                      'just need a few more minutes to get it right.');
                  } else {
                    logger.error('An error occured with the apimap sent to ' +
                      'Forest. Please contact support@forestadmin.com for ' +
                      'further investigations.');
                  }
                }
              });
        }
      }
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
