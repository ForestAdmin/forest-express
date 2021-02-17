"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var _ = require('lodash');

var nodePath = require('path');

var SchemaUtil = require('../utils/schema');

var auth = require('../services/auth');

var path = require('../services/path');

var ResourceSerializer = require('../serializers/resource');

var Schemas = require('../generators/schemas');

var CSVExporter = require('../services/csv-exporter');

var ResourceDeserializer = require('../deserializers/resource');

var IdsFromRequestRetriever = require('../services/ids-from-request-retriever');

var ParamsFieldsDeserializer = require('../deserializers/params-fields');

module.exports = function Associations(app, model, Implementation, integrator, opts) {
  var modelName = Implementation.getModelName(model);
  var schema = Schemas.schemas[modelName];

  function getAssociationField(associationName) {
    var field = _.find(schema.fields, {
      field: associationName
    });

    if (field && field.reference) {
      return field.reference.split('.')[0];
    }

    return null;
  }

  function getAssociation(request) {
    var pathSplit = request.route.path.split('/');
    var associationName = pathSplit[pathSplit.length - 1];

    if (nodePath.extname(associationName) === '.csv') {
      associationName = nodePath.basename(associationName, '.csv');
    } else if (associationName === 'count') {
      associationName = pathSplit[pathSplit.length - 2];
    }

    return {
      associationName: associationName
    };
  }

  function getContext(request) {
    var association = getAssociation(request);

    var params = _.extend(request.query, request.params, association);

    var models = Implementation.getModels();
    var associationField = getAssociationField(params.associationName);

    var associationModel = _.find(models, function (refModel) {
      return Implementation.getModelName(refModel) === associationField;
    });

    return {
      params: params,
      associationModel: associationModel
    };
  }

  function list(request, response, next) {
    var _getContext = getContext(request),
        params = _getContext.params,
        associationModel = _getContext.associationModel;
    params.userRequest = request.user;

    var fieldsPerModel = new ParamsFieldsDeserializer(params.fields).perform();
    return new Implementation.HasManyGetter(model, associationModel, opts, params).perform().then(function (_ref) {
      var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
          records = _ref2[0],
          fieldsSearched = _ref2[1];

      return new ResourceSerializer(Implementation, associationModel, records, integrator, {userRequest: params.userRequest}, fieldsSearched, params.search, fieldsPerModel).perform(); //SPA
    }).then(function (records) {
      return response.send(records);
    })["catch"](next);
  }

  function count(request, response, next) {
    var _getContext2 = getContext(request),
        params = _getContext2.params,
        associationModel = _getContext2.associationModel;

    return new Implementation.HasManyGetter(model, associationModel, opts, params).count().then(function (recordsCount) {
      return response.send({
        count: recordsCount
      });
    })["catch"](next);
  }

  function exportCSV(request, response, next) {
    var _getContext3 = getContext(request),
        params = _getContext3.params,
        associationModel = _getContext3.associationModel;

    var recordsExporter = new Implementation.ResourcesExporter(model, opts, params, associationModel);
    return new CSVExporter(params, response, Implementation.getModelName(associationModel), recordsExporter).perform()["catch"](next);
  }

  function add(request, response, next) {
    var params = _.extend(request.params, getAssociation(request));

    var data = request.body;
    var models = Implementation.getModels();
    var associationField = getAssociationField(params.associationName);

    var associationModel = _.find(models, function (innerModel) {
      return Implementation.getModelName(innerModel) === associationField;
    });

    return new Implementation.HasManyAssociator(model, associationModel, opts, params, data).perform().then(function () {
      response.status(204).send();
    })["catch"](next);
  }

  function remove(_x, _x2, _x3) {
    return _remove.apply(this, arguments);
  }

  function _remove() {
    _remove = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(request, response, next) {
      var _getContext4, params, associationModel, body, hasBodyAttributes, isLegacyRequest, recordsGetter, recordsCounter, primaryKeysGetter, ids;

      return _regenerator["default"].wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _getContext4 = getContext(request), params = _getContext4.params, associationModel = _getContext4.associationModel;
              // NOTICE: There are three ways to receive request data from frontend:
              //         - Legacy: `{ body: { data: [ { id: 1, … }, { id: 2, … }, … ]} }`.
              //         - IDs (select some)
              //         - Or query params (select all).
              //
              //         The HasManyDissociator currently accepts a `data` parameter that has to be formatted
              //         as the legacy one.
              hasBodyAttributes = request.body && request.body.data && request.body.data.attributes;
              isLegacyRequest = request.body && request.body.data && Array.isArray(request.body.data);

              if (!(!hasBodyAttributes && isLegacyRequest)) {
                _context3.next = 7;
                break;
              }

              body = request.body;
              _context3.next = 15;
              break;

            case 7:
              if (!hasBodyAttributes) {
                _context3.next = 15;
                break;
              }

              recordsGetter = /*#__PURE__*/function () {
                var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(attributes) {
                  var _yield$Implementation, _yield$Implementation2, records;

                  return _regenerator["default"].wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          _context.next = 2;
                          return new Implementation.HasManyGetter(model, associationModel, opts, _objectSpread(_objectSpread(_objectSpread({}, params), attributes.allRecordsSubsetQuery), {}, {
                            page: attributes.page
                          })).perform();

                        case 2:
                          _yield$Implementation = _context.sent;
                          _yield$Implementation2 = (0, _slicedToArray2["default"])(_yield$Implementation, 1);
                          records = _yield$Implementation2[0];
                          return _context.abrupt("return", records);

                        case 6:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee);
                }));

                return function recordsGetter(_x4) {
                  return _ref3.apply(this, arguments);
                };
              }();

              recordsCounter = /*#__PURE__*/function () {
                var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
                  return _regenerator["default"].wrap(function _callee2$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          return _context2.abrupt("return", new Implementation.HasManyGetter(model, associationModel, opts, params).count());

                        case 1:
                        case "end":
                          return _context2.stop();
                      }
                    }
                  }, _callee2);
                }));

                return function recordsCounter() {
                  return _ref4.apply(this, arguments);
                };
              }();

              primaryKeysGetter = function primaryKeysGetter() {
                return Schemas.schemas[Implementation.getModelName(associationModel)];
              };

              _context3.next = 13;
              return new IdsFromRequestRetriever(recordsGetter, recordsCounter, primaryKeysGetter).perform(request);

            case 13:
              ids = _context3.sent;
              body = {
                data: ids.map(function (id) {
                  return {
                    id: id
                  };
                })
              };

            case 15:
              return _context3.abrupt("return", new Implementation.HasManyDissociator(model, associationModel, opts, params, body).perform().then(function () {
                response.status(204).send();
              })["catch"](next));

            case 16:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
    }));
    return _remove.apply(this, arguments);
  }

  function update(request, response, next) {
    var params = _.extend(request.params, getAssociation(request));

    var data = request.body;
    var models = Implementation.getModels();
    var associationField = getAssociationField(params.associationName);

    var associationModel = _.find(models, function (innerModel) {
      return Implementation.getModelName(innerModel) === associationField;
    });

    return new Implementation.BelongsToUpdater(model, associationModel, opts, params, data).perform().then(function () {
      response.status(204).send();
    })["catch"](next);
  }

  function updateEmbeddedDocument(association) {
    return function (request, response, next) {
      return new ResourceDeserializer(Implementation, model, request.body, false).perform().then(function (record) {
        return new Implementation.EmbeddedDocumentUpdater(model, request.params, association, record).perform();
      }).then(function () {
        return response.status(204).send();
      })["catch"](next);
    };
  }

  this.perform = function () {
    // NOTICE: HasMany associations routes
    _.each(SchemaUtil.getHasManyAssociations(schema), function (association) {
      app.get(path.generate("".concat(modelName, "/:recordId/relationships/").concat(association.field, ".csv"), opts), auth.ensureAuthenticated, exportCSV);
      app.get(path.generate("".concat(modelName, "/:recordId/relationships/").concat(association.field), opts), auth.ensureAuthenticated, list);
      app.get(path.generate("".concat(modelName, "/:recordId/relationships/").concat(association.field, "/count"), opts), auth.ensureAuthenticated, count);
      app.post(path.generate("".concat(modelName, "/:recordId/relationships/").concat(association.field), opts), auth.ensureAuthenticated, add); // NOTICE: This route only works for embedded has many

      app.put(path.generate("".concat(modelName, "/:recordId/relationships/").concat(association.field, "/:recordIndex"), opts), auth.ensureAuthenticated, updateEmbeddedDocument(association.field));
      app["delete"](path.generate("".concat(modelName, "/:recordId/relationships/").concat(association.field), opts), auth.ensureAuthenticated, remove);
    }); // NOTICE: belongsTo associations routes


    _.each(SchemaUtil.getBelongsToAssociations(schema), function (association) {
      app.put(path.generate("".concat(modelName, "/:recordId/relationships/").concat(association.field), opts), auth.ensureAuthenticated, update);
    });
  };
};