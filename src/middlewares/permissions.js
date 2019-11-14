const PermissionsChecker = require('../services/permissions-checker');
const httpError = require('http-errors');
const logger = require('../services/logger');
const StateManager = require('../services/state-manager');

const stateManager = StateManager.getInstance();

const getRenderingIdFromUser = user => user.renderingId;

class PermissionMiddleWareCreator {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  _checkPermission(permissionName) {
    return (request, response, next) => {
      const environmentSecret = stateManager.lianaOptions.envSecret;
      const renderingId = getRenderingIdFromUser(request.user);

      return new PermissionsChecker(
        environmentSecret,
        renderingId,
        this.collectionName,
        permissionName,
      )
        .perform()
        .then(next)
        .catch((error) => {
          logger.error(error.message);
          next(httpError(403));
        });
    };
  }

  list() {
    return (request, response, next) => {
      const { searchToEdit } = request.query;
      const permissionName = searchToEdit ? 'searchToEdit' : 'list';

      return this._checkPermission(permissionName)(request, response, next);
    };
  }

  export() {
    return this._checkPermission('export');
  }

  details() {
    return this._checkPermission('show');
  }

  create() {
    return this._checkPermission('create');
  }

  update() {
    return this._checkPermission('update');
  }

  delete() {
    return this._checkPermission('delete');
  }
}

module.exports = PermissionMiddleWareCreator;
