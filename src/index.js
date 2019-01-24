const P = require('bluebird');
const _ = require('lodash');
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('express-jwt');
const auth = require('./services/auth');
const { prettyPrint } = require('./utils/json');
const ResourcesRoutes = require('./routes/resources');
const ActionsRoutes = require('./routes/actions');
const AssociationsRoutes = require('./routes/associations');
const StatRoutes = require('./routes/stats');
const SessionRoute = require('./routes/sessions');
const ForestRoutes = require('./routes/forest');
const Schemas = require('./generators/schemas');
const CollectionSerializer = require('./serializers/collection');
const logger = require('./services/logger');
const Integrator = require('./integrations');
const errorHandler = require('./services/error-handler');
const ApimapSender = require('./services/apimap-sender');
const ipWhitelist = require('./services/ip-whitelist');
const ApimapFieldsFormater = require('./services/apimap-fields-formater');

const readdirAsync = P.promisify(fs.readdir);

let jwtAuthenticator;

const SCHEMA_FILENAME = `${path.resolve('.')}/.forestadmin-schema.json`;

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
      if (!opts.envSecret) { return; }

      if (opts.envSecret.length !== 64) {
        logger.error('Your envSecret does not seem to be correct. Can you ' +
          'check on Forest that you copied it properly in the Forest ' +
          'initialization?');
        return;
      }

      const collectionsSerializer = new CollectionSerializer(Implementation);
      const { options: serializerOptions } = collectionsSerializer;

      let collections = [];
      if (process.env.NODE_ENV && process.env.NODE_ENV !== 'development') {
        try {
          const content = fs.readFileSync(SCHEMA_FILENAME);
          if (!content) {
            logger.error('Your .forestadmin-schema.json is empty, the apimap cannot be send');
          } else {
            collections = JSON.parse(content).collections;
            const setMissingAttributes = (object, oldObject, attributes) => {
              Object.keys(oldObject).forEach((key) => {
                if (attributes.includes(key)) {
                  return;
                }

                object[key] = oldObject[key];
              });
            };
            collections.forEach((collection) => {
              const oldCollection = Schemas.schemas[collection.name];
              if (oldCollection) { return; }
              setMissingAttributes(collection, oldCollection, serializerOptions.attributes);

              collection.fields.forEach((field) => {
                const oldField = _.find(oldCollection.fields, { field: field.field });
                if (!oldField) { return; }
                setMissingAttributes(field, oldField, serializerOptions.fields.attributes);
              });

              collection.segments.forEach((segment) => {
                const oldSegment = _.find(oldCollection.segments, { name: segment.name });
                if (!oldSegment) { return; }
                setMissingAttributes(segment, oldSegment, serializerOptions.segments.attributes);
              });

              collection.actions.forEach((action) => {
                const oldAction = _.find(oldCollection.actions, { name: action.name });
                if (!oldAction) { return; }
                setMissingAttributes(action, oldAction, serializerOptions.actions.attributes);

                action.fields.forEach((field) => {
                  const oldField = _.find(oldAction.fields, { field: field.field });
                  if (!oldField) { return; }
                  setMissingAttributes(
                    field,
                    oldField,
                    serializerOptions.actions.fields.attributes,
                  );
                });
              });
            });

            // Schemas.schemas = collections;
            Schemas.schemas = {};
            collections.forEach((collection) => {
              Schemas.schemas[collection.name] = collection;
            });
          }
        } catch (error) {
          if (error.code === 'ENOENT') {
            logger.error('.forestadmin-schema.json does not exists, the apimap cannot be send');
          } else {
            logger.error('The content of .forestadmin-schema.json is not a correct JSON, the apimap cannot be send');
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

      if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        // NOTICE: Reorder the collections to make the diff null or minimal
        collections = collections.map((collection) => {
          const collectionReordered = {};
          const orderedCollectionKeys = _.sortBy(
            Object.keys(collection),
            key => serializerOptions.attributes.indexOf(key),
          );
          _.each(orderedCollectionKeys, (key) => {
            if (serializerOptions.attributes.includes(key)) {
              collectionReordered[key] = collection[key];
            }
          });

          collectionReordered.fields = collectionReordered.fields || [];
          collectionReordered.fields = collectionReordered.fields.map((field) => {
            const fieldReordered = {};
            const orderedFieldKeys = _.sortBy(
              Object.keys(field),
              key => serializerOptions.fields.attributes.indexOf(key),
            );
            _.each(orderedFieldKeys, (key) => {
              if (serializerOptions.fields.attributes.includes(key)) {
                fieldReordered[key] = field[key];
              }
            });

            fieldReordered.validations = fieldReordered.validations || [];
            fieldReordered.validations = fieldReordered.validations.map((validation) => {
              const validationReordered = {};
              const orderedValidationKeys = _.sortBy(
                Object.keys(validation),
                key => serializerOptions.validations.attributes.indexOf(key),
              );
              _.each(orderedValidationKeys, (key) => {
                if (serializerOptions.validations.attributes.includes(key)) {
                  validationReordered[key] = validation[key];
                }
              });
              return validationReordered;
            });
            return fieldReordered;
          });
          collectionReordered.fields = _.sortBy(collectionReordered.fields, ['field', 'type']);

          collectionReordered.segments = collectionReordered.segments || [];
          collectionReordered.segments = collectionReordered.segments.map((segment) => {
            const segmentReordered = {};
            const orderedSegmentKeys = _.sortBy(
              Object.keys(segment),
              key => serializerOptions.segments.attributes.indexOf(key),
            );
            _.each(orderedSegmentKeys, (key) => {
              if (serializerOptions.segments.attributes.includes(key)) {
                segmentReordered[key] = segment[key];
              }
            });
            return segmentReordered;
          });
          collectionReordered.segments = _.sortBy(collectionReordered.segments, ['name']);

          collectionReordered.actions = collectionReordered.actions || [];
          collectionReordered.actions = collectionReordered.actions.map((action) => {
            const actionReordered = {};
            const orderedActionKeys = _.sortBy(
              Object.keys(action),
              key => serializerOptions.actions.attributes.indexOf(key),
            );
            _.each(orderedActionKeys, (key) => {
              if (serializerOptions.actions.attributes.includes(key)) {
                actionReordered[key] = action[key];
              }
            });
            actionReordered.fields = actionReordered.fields || [];
            actionReordered.fields = actionReordered.fields.map((field) => {
              const fieldReordered = {};
              const orderedFieldKeys = _.sortBy(
                Object.keys(field),
                key => serializerOptions.actions.fields.attributes.indexOf(key),
              );
              _.each(orderedFieldKeys, (key) => {
                if (serializerOptions.actions.fields.attributes.includes(key)) {
                  fieldReordered[key] = field[key];
                }
              });
              return fieldReordered;
            });
            return actionReordered;
          });
          collectionReordered.actions = _.sortBy(collectionReordered.actions, ['name']);

          return collectionReordered;
        });
        collections.sort((collection1, collection2) =>
          collection1.name.localeCompare(collection2.name));

        const forestAdminSchema = {
          collections,
          meta: {
            database_type: Implementation.getDatabaseType(),
            liana: Implementation.getLianaName(),
            liana_version: Implementation.getLianaVersion(),
            orm_version: Implementation.getOrmVersion(),
          },
        };
        fs.writeFileSync(SCHEMA_FILENAME, prettyPrint(forestAdminSchema));
      }

      if (process.env.FOREST_DISABLE_AUTO_SCHEMA_APPLY
        && Number(process.env.FOREST_DISABLE_AUTO_SCHEMA_APPLY)) {
        return;
      }

      const apimap = collectionsSerializer.perform(collections);
      new ApimapSender(opts.envSecret, apimap).perform();
    })
    .then(() => ipWhitelist
      .retrieve(opts.envSecret)
      .catch(error => logger.error(error)))
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

  Schemas.cleanCollection(Schemas.schemas[name]);
};

exports.logger = require('./services/logger');
exports.StatSerializer = require('./serializers/stat');
exports.ResourceSerializer = require('./serializers/resource');
exports.ResourceDeserializer = require('./deserializers/resource');
