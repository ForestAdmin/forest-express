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
var StripeRoutes = require('./routes/stripe');
var IntercomRoutes = require('./routes/intercom');
var StatRoutes = require('./routes/stats');
var SessionRoute = require('./routes/sessions');
var ForestRoutes = require('./routes/forest');
var Schemas = require('./generators/schemas');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var request = require('superagent');
var logger = require('./services/logger');

function requireAllModels(Implementation, modelsDir) {
  return fs.readdirAsync(modelsDir)
    .each(function (file) {
      try {
        require(path.join(modelsDir, file));
      } catch (e) { }
    })
    .then(function () {
      return _.values(Implementation.getModels());
    });
}

exports.Schemas = Schemas;

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

  function setupStripeIntegration(apimap, collectionAndFieldName) {
    // jshint camelcase: false
    var collectionName = collectionAndFieldName.split('.')[0];
    var model = Implementation.getModels()[collectionName];
    var referenceName = Implementation.getModelName(model) + '.id';

    apimap.push({
      name: collectionName + '_stripe_payments',
      isVirtual: true,
      isReadOnly: true,
      fields: [
        { field: 'id', type: 'String', isSearchable: false },
        { field: 'created', type: 'Date', isSearchable: false },
        { field: 'amount', type: 'Number', isSearchable: false },
        { field: 'status', type: 'String', isSearchable: false },
        { field: 'currency', type: 'String', isSearchable: false },
        { field: 'refunded', type: 'Boolean', isSearchable: false },
        { field: 'description', type: 'String', isSearchable: false },
        {
          field: 'customer',
          type: 'String',
          reference: referenceName,
          'isSearchable': false
        }
      ],
      actions: [{
        name: 'Refund',
        endpoint: '/forest/stripe_payments/refunds'
      }]
    });

    apimap.push({
      name: collectionName + '_stripe_invoices',
      isVirtual: true,
      isReadOnly: true,
      fields: [
        { field: 'id', type: 'String', isSearchable: false },
        { field: 'amount_due', type: 'Number', isSearchable: false },
        { field: 'attempt_count', type: 'Number', isSearchable: false },
        { field: 'attempted', type: 'Boolean', isSearchable: false },
        { field: 'closed', type: 'Boolean', isSearchable: false },
        { field: 'currency', type: 'String', isSearchable: false },
        { field: 'date', type: 'Date', isSearchable: false },
        { field: 'forgiven', type: 'Boolean', isSearchable: false },
        { field: 'period_start', type: 'Date', isSearchable: false },
        { field: 'period_end', type: 'Date', isSearchable: false },
        { field: 'subtotal', type: 'Number', isSearchable: false },
        { field: 'total', type: 'Number', isSearchable: false },
        { field: 'application_fee', type: 'Number', isSearchable: false },
        { field: 'tax', type: 'Number', isSearchable: false },
        { field: 'tax_percent', type: 'Number', isSearchable: false },
        {
          field: 'customer',
          type: 'String',
          reference: referenceName,
          isSearchable: false
        }
      ]
    });

    apimap.push({
      name: collectionName + '_stripe_cards',
      isVirtual: true,
      isReadOnly: true,
      onlyForRelationships: true,
      fields: [
        { field: 'id', type: 'String', isSearchable: false },
        { field: 'last4', type: 'String', isSearchable: false },
        { field: 'brand', type: 'String', isSearchable: false },
        { field: 'funding', type: 'String', isSearchable: false },
        { field: 'exp_month', type: 'Number', isSearchable: false },
        { field: 'exp_year', type: 'Number', isSearchable: false },
        { field: 'country', type: 'String', isSearchable: false },
        { field: 'name', type: 'String', isSearchable: false },
        { field: 'address_line1', type: 'String', isSearchable: false },
        { field: 'address_line2', type: 'String', isSearchable: false },
        { field: 'address_city', type: 'String', isSearchable: false },
        { field: 'address_state', type: 'String', isSearchable: false },
        { field: 'address_zip', type: 'String', isSearchable: false },
        { field: 'address_country', type: 'String', isSearchable: false },
        { field: 'cvc_check', type: 'String', isSearchable: false },
        {
          field: 'customer',
          type: 'String',
          reference: referenceName,
          isSearchable: false
        }
      ]
    });
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
    // jshint camelcase: false
    apimap.push({
      name: collectionName + '_intercom_conversations',
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
  app.use(jwt({
    secret: opts.authKey,
    credentialsRequired: false
  }).unless({ path: /^(?!\/forest).*/ }));

  new SessionRoute(app, opts).perform();

  //// Init
  var absModelDirs = path.resolve('.', opts.modelsDir);
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
              setupStripeIntegration(collections, collectionAndFieldName);
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
          attributes: ['name', 'fields', 'actions', 'onlyForRelationships',
            'isVirtual', 'isReadOnly'],
          fields: {
            attributes: ['field', 'type', 'enums', 'collection_name',
              'reference', 'column', 'isSearchable', 'widget', 'integration']
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
            .end(function(err, res) {
              if (res.status !== 204) {
                logger.debug('Forest cannot find your project secret key. ' +
                  'Please, ensure you have installed the Forest Liana ' +
                  'correctly.');
              }
            });
      }
    });

  return app;
};

exports.collection = function (name, opts) {
  var collection = _.find(Schemas.schemas, { name: name });

  if (!collection) {
    opts.name = name;
    Schemas.schemas[name] = opts;
  } else {
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
  }
};

exports.ensureAuthenticated = require('./services/auth').ensureAuthenticated;
exports.StatSerializer = require('./serializers/stat') ;
exports.ResourceSerializer = require('./serializers/resource') ;
