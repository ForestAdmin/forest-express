'use strict';
var P = require('bluebird');
var _ = require('lodash');
var express = require('express');
var path = require('path');
var fs = P.promisifyAll(require('fs'));
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

function requireAllModels(Implementation, modelsDir) {
  if (modelsDir) {
    return fs.readdirAsync(modelsDir)
      .each(function (file) {
        try {
          require(path.join(modelsDir, file));
        } catch (e) { }
      })
      .then(function () {
        return _.values(Implementation.getModels());
      });
  } else {
    // NOTICE: User didn't provide a modelsDir but may already have required
    // them manually so they might be available.
    return P.resolve(_.values(Implementation.getModels()));
  }
}

exports.Schemas = Schemas;
exports.logger = logger;

exports.init = function (Implementation) {
  var opts = Implementation.opts;
  var app = express();
  var integrator = new Integrator(opts);

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
      credentialsRequired: false
    });
  } else {
    logger.error('Your Forest authSecret seems to be missing. Can you check ' +
      'that you properly set a Forest authSecret in the Forest initializer?');
  }

  if (jwtAuthenticator) {
    if (opts.expressParentApp) {
      // NOTICE: Forest is a sub-app of the client application; so all routes are
      //         protected with JWT.
      app.use(jwtAuthenticator);
    } else {
      // NOTICE: Forest routes are part of the client app; only Forest routes are
      //         protected with JWT.
      app.use(jwtAuthenticator.unless({ path: /^(?!\/forest).*/ }));
    }
  }

  new SessionRoute(app, opts).perform();

  // Init
  var absModelDirs = opts.modelsDir ? path.resolve('.', opts.modelsDir) : undefined;
  requireAllModels(Implementation, absModelDirs)
    .then(function (models) {
      return Schemas.perform(Implementation, integrator, models, opts)
        .then(function () {
          var directorySmartImplementation;

          if (opts.configDir) {
            directorySmartImplementation = path.resolve('.', opts.configDir);
          } else {
            directorySmartImplementation = path.resolve('.') + '/forest';
          }

          return requireAllModels(Implementation, directorySmartImplementation)
            .catch(function () {
              // The forest/ directory does not exist. It's not a problem.
            });
        })
        .thenReturn(models);
    })
    .each(function (model) {
      integrator.defineRoutes(app, model, Implementation);

      new ResourcesRoutes(app, model, Implementation, integrator, opts)
        .perform();

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
          integrator.defineCollections(Implementation, collections);

          var apimap = new JSONAPISerializer('collections', collections, {
            id: 'name',
            attributes: ['name', 'displayName', 'paginationType', 'icon',
              'fields', 'actions', 'segments', 'onlyForRelationships',
              'isVirtual', 'isReadOnly'],
            fields: {
              attributes: ['field', 'displayName', 'type', 'enums',
                'collection_name', 'reference', 'column', 'isSearchable',
                'widget', 'integration', 'isReadOnly', 'isVirtual']
            },
            actions: {
              ref: 'id',
              attributes: ['name', 'endpoint', 'httpMethod', 'fields']
            },
            segments: {
              ref: 'id',
              attributes: ['name']
            },
            meta: {
              'liana': Implementation.getLianaName(),
              'liana_version': Implementation.getLianaVersion()
            }
          });

          var forestUrl = process.env.FOREST_URL ||
            'https://forestadmin-server.herokuapp.com';

          request
            .post(forestUrl + '/forest/apimaps')
              .send(apimap)
              .set('forest-secret-key', opts.envSecret)
              .end(function(error, result) {
                if (result && result.status !== 204) {
                  if (result.status === 0) {
                    logger.warn('Cannot send the apimap to Forest. Are you ' +
                      'online?');
                  } else if (result.status === 404) {
                    logger.error('Cannot find the project related to the ' +
                      'envSecret you configured. Can you check on Forest ' +
                      'that you copied it properly in the Forest initialization?');
                  } else {
                    logger.error('An error occured with the apimap sent to ' +
                      'Forest. Please contact support@forestadmin.com for ' +
                      'further investigations.');
                  }
                }
              });
        }
      }
    });

  if (opts.expressParentApp) {
    opts.expressParentApp.use('/forest', app);
  }

  return app;
};

exports.collection = function (name, opts) {
  if (_.isEmpty(Schemas.schemas)) {
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

    opts.fields = _.map(opts.fields, function (field) {
      // Smart field
      field.isVirtual = true;
      field.isSearchable = false;
      field.isReadOnly = true;

      return field;
    });

    Schemas.schemas[name].fields = _.concat(opts.fields,
      Schemas.schemas[name].fields);
  } else {
    // NOTICE: Custom collection definition case
    opts.name = name;
    Schemas.schemas[name] = opts;
  }
};

exports.logger = require('./services/logger');
exports.ensureAuthenticated = require('./services/auth').ensureAuthenticated;
exports.StatSerializer = require('./serializers/stat');
exports.ResourceSerializer = require('./serializers/resource');
exports.ResourceDeserializer = require('./deserializers/resource');
