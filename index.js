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
var StripeSetup = require('./integrations/stripe/setup');
var StripeRoutes = require('./integrations/stripe/routes');
var IntercomRoutes = require('./routes/intercom');
var StatRoutes = require('./routes/stats');
var SessionRoute = require('./routes/sessions');
var ForestRoutes = require('./routes/forest');
var Schemas = require('./generators/schemas');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var request = require('superagent');
var logger = require('./services/logger');

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
  function hasStripeIntegration() {
    return opts.integrations && opts.integrations.stripe &&
      opts.integrations.stripe.apiKey;
  }

  function castToArray(value) {
    return _.isString(value) ? [value] : value;
  }

  function isStripeProperlyIntegrated() {
    return opts.integrations.stripe.apiKey &&
      opts.integrations.stripe.stripe && opts.integrations.stripe.mapping;
  }

  function isStripeIntegrationDeprecated() {
    var integrationValid = opts.integrations.stripe.apiKey &&
      opts.integrations.stripe.stripe &&
        (opts.integrations.stripe.userCollection ||
          opts.integrations.stripe.userCollection);

    if (integrationValid) {
      logger.warn('Stripe integration attributes "userCollection" and ' +
        '"userField" are now deprecated, please use "mapping" attribute.');
      opts.integrations.stripe.mapping =
        opts.integrations.stripe.userCollection + '.' +
          opts.integrations.stripe.userField;
    }

    return integrationValid;
  }

  function hasIntercomIntegration() {
    return opts.integrations && opts.integrations.intercom;
  }

  function isIntercomProperlyIntegrated() {
    return opts.integrations.intercom.apiKey &&
      opts.integrations.intercom.appId && opts.integrations.intercom.intercom &&
      opts.integrations.intercom.mapping;
  }

  function isIntercomIntegrationDeprecated() {
    var integrationValid = opts.integrations.intercom.apiKey &&
      opts.integrations.intercom.appId && opts.integrations.intercom.intercom &&
      opts.integrations.intercom.userCollection;

    if (integrationValid) {
      logger.warn('Intercom integration attribute "userCollection" is now ' +
        'deprecated, please use "mapping" attribute.');
      opts.integrations.intercom.mapping =
        opts.integrations.intercom.userCollection;
    }

    return integrationValid;
  }

  function setupIntercomIntegration(apimap, collectionName) {
    var collectionDisplayName = _.capitalize(collectionName);

    // jshint camelcase: false
    apimap.push({
      name: collectionName + '_intercom_conversations',
      displayName: collectionDisplayName + ' Conversations',
      icon: 'intercom',
      onlyForRelationships: true,
      isVirtual: true,
      isReadOnly: true,
      fields: [
        { field: 'subject', type: 'String' },
        { field: 'body', type: ['String'], widget: 'link' },
        { field: 'open', type: 'Boolean'},
        { field: 'read', type: 'Boolean'},
        { field: 'assignee', type: 'String' }
      ]
    });

    apimap.push({
      name: collectionName + '_intercom_attributes',
      displayName: collectionDisplayName + ' Attributes',
      icon: 'intercom',
      onlyForRelationships: true,
      isVirtual: true,
      isReadOnly: true,
      fields: [
        { field: 'created_at', type: 'Date', isSearchable: false },
        { field: 'updated_at', type: 'Date', isSearchable: false  },
        { field: 'session_count', type: 'Number', isSearchable: false  },
        { field: 'last_seen_ip', type: 'String', isSearchable: false  },
        { field: 'signed_up_at', type: 'Date', isSearchable: false  },
        { field: 'country', type: 'String', isSearchable: false  },
        { field: 'city', type: 'String', isSearchable: false  },
        { field: 'browser', type: 'String', isSearchable: false  },
        { field: 'platform', type: 'String', isSearchable: false  },
        { field: 'companies', type: 'String', isSearchable: false  },
        { field: 'segments', type: 'String', isSearchable: false  },
        { field: 'tags', type: 'String', isSearchable: false  },
        {
          field: 'geoloc',
          type: 'String',
          widget: 'google map',
          isSearchable: false
        }
      ]
    });
  }

  var app = express();
  var opts = Implementation.opts;

  var integrationStripeValid = false;
  var integrationIntercomValid = false;

  function checkIntegrationsSetup () {
    if (hasStripeIntegration()) {
      if (isStripeProperlyIntegrated() || isStripeIntegrationDeprecated()) {
        opts.integrations.stripe.mapping =
          castToArray(opts.integrations.stripe.mapping);
        integrationStripeValid = true;
      } else {
        logger.error('Cannot setup properly your Stripe integration.');
      }
    }

    if (hasIntercomIntegration()) {
      if (isIntercomProperlyIntegrated() ||
            isIntercomIntegrationDeprecated()) {
        opts.integrations.intercom.mapping =
          castToArray(opts.integrations.intercom.mapping);
        integrationIntercomValid = true;
      } else {
        logger.error('Cannot setup properly your Intercom integration.');
      }
    }
  }

  checkIntegrationsSetup();

  if (opts.jwtSigningKey) {
    console.warn('DEPRECATION WARNING: the use of jwtSigningKey option is ' +
    'deprecated. Use secret_key and auth_key instead. More info at: ' +
    'https://github.com/ForestAdmin/forest-express-mongoose/releases/tag/0.1.0');
    opts.authKey = opts.jwtSigningKey;
    opts.secretKey = opts.jwtSigningKey;
  }

  // CORS
  app.use(cors({
    allowedOrigins: ['localhost:4200', '*.forestadmin.com'],
      headers: ['Authorization', 'X-Requested-With', 'Content-Type']
  }));

  // Mime type
  app.use(bodyParser.json());

  // Authentication
  var jwtAuthenticator = jwt({
    secret: opts.authKey,
    credentialsRequired: false
  });

  if (opts.expressParentApp) {
    // NOTICE: Forest is a sub-app of the client application; so all routes are
    //         protected with JWT.
    app.use(jwtAuthenticator);
  } else {
    // NOTICE: Forest routes are part of the client app; only Forest routes are
    //         protected with JWT.
    app.use(jwtAuthenticator.unless({ path: /^(?!\/forest).*/ }));
  }

  new SessionRoute(app, opts).perform();

  //// Init
  var absModelDirs = opts.modelsDir ? path.resolve('.', opts.modelsDir) : undefined;
  requireAllModels(Implementation, absModelDirs)
    .then(function (models) {
      return Schemas.perform(Implementation, models, opts)
        .then(function () {
          return requireAllModels(Implementation, path.resolve('.') + '/forest')
            .catch(function () {
              // The forest/ directory does not exist. It's not a problem.
            });
        })
        .thenReturn(models);
    })
    .each(function (model) {
      new StripeRoutes(app, model, Implementation, opts).perform();
      new IntercomRoutes(app, model, Implementation, opts).perform();
      new ResourcesRoutes(app, model, Implementation, opts).perform();
      new AssociationsRoutes(app, model, Implementation, opts).perform();
      new StatRoutes(app, model, Implementation, opts).perform();
    })
    .then(function () {
      new ForestRoutes(app, opts).perform();
    })
    .then(function () {
      if (opts.authKey) {
        var collections = _.values(Schemas.schemas);

        if (integrationStripeValid) {
          _.each(opts.integrations.stripe.mapping,
            function (collectionAndFieldName) {
              StripeSetup.createCollections(Implementation, collections,
                collectionAndFieldName);
            });
        }

        if (integrationIntercomValid) {
          _.each(opts.integrations.intercom.mapping,
            function (collectionName) {
              setupIntercomIntegration(collections, collectionName);
            });
        }

        var json = new JSONAPISerializer('collections', collections, {
          id: 'name',
          attributes: ['name', 'displayName', 'paginationType', 'icon',
            'fields', 'actions', 'onlyForRelationships', 'isVirtual',
            'isReadOnly'],
          fields: {
            attributes: ['field', 'displayName', 'type', 'enums',
              'collection_name', 'reference', 'column', 'isSearchable',
              'widget', 'integration', 'isReadOnly']
          },
          actions: {
            ref: 'name',
            attributes: ['name', 'endpoint', 'httpMethod', 'fields']
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
            .send(json)
            .set('forest-secret-key', opts.secretKey)
            .end(function(error, result) {
              if (result && result.status !== 204) {
                logger.error('Cannot find your project secret key. ' +
                  'Please, ensure you have installed the Forest Liana ' +
                  'correctly.');
              } else if (error) {
                logger.warn('Cannot send the apimap to Forest. Are you ' +
                  'online?');
                return;
              }
            });
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

  if (collection) {
    Schemas.schemas[name].actions = opts.actions;

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

exports.ensureAuthenticated = require('./services/auth').ensureAuthenticated;
exports.StatSerializer = require('./serializers/stat') ;
exports.ResourceSerializer = require('./serializers/resource') ;
