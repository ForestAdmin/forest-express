const P = require('bluebird');
const moment = require('moment');
const VError = require('verror');
const _ = require('lodash');
const forestServerRequester = require('./forest-server-requester');
const { perform: parseFilters } = require('./base-filters-parser');
const logger = require('./logger');

const EXPIRATION_IN_SECONDS = process.env.FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS || 3600;

class PermissionsChecker {
  constructor(environmentSecret, renderingId) {
    this.environmentSecret = environmentSecret;
    this.renderingId = renderingId;
  }

  static expirationInSeconds = EXPIRATION_IN_SECONDS;

  static isrolesACLActivated;

  // This permissions object is the cache, shared by all instances of PermissionsChecker.
  static permissions = { collections: {}, renderings: {} };


  static cleanCache() {
    PermissionsChecker.permissions = { collections: {}, renderings: {} };
  }

  // In the teamACL format, all the permissions are stored by renderingId into "renderings".
  // For the rolesACL format, the collections permissions are stored directly into "collections",
  // and only their scopes are stored by renderingId into "renderings".
  static getCollectionsPermissions(renderingId) {
    if (PermissionsChecker.isrolesACLActivated) {
      return PermissionsChecker.permissions.collections.data;
    }
    return PermissionsChecker.permissions.renderings[renderingId]
      ? PermissionsChecker.permissions.renderings[renderingId].data
      : null;
  }

  _getScopePermissions(collectionName) {
    if (PermissionsChecker.permissions.renderings[this.renderingId]
      && PermissionsChecker.permissions.renderings[this.renderingId].data
      && PermissionsChecker.permissions.renderings[this.renderingId].data[collectionName]) {
      return PermissionsChecker.permissions.renderings[this.renderingId].data[collectionName].scope;
    }
    return null;
  }

  static transformPermissionsFromOldToNewFormat(permissions) {
    Object.keys(permissions).forEach((modelName) => {
      permissions[modelName].collection = {
        browseEnabled: permissions[modelName].collection.list || false,
        readEnabled: permissions[modelName].collection.show || false,
        editEnabled: permissions[modelName].collection.create || false,
        addEnabled: permissions[modelName].collection.update || false,
        deleteEnabled: permissions[modelName].collection.delete || false,
        exportEnabled: permissions[modelName].collection.export || false,
        // This searchToEdit permission exists in the teamsACL format & must be taken into account.
        searchToEdit: permissions[modelName].collection.searchToEdit || false,
      };

      if (permissions[modelName].actions) {
        Object.keys(permissions[modelName].actions).forEach((actionName) => {
          permissions[modelName].actions[actionName] = {
            triggerEnabled: permissions[modelName].actions[actionName].users
              ? permissions[modelName].actions[actionName].allowed
                && permissions[modelName].actions[actionName].users
              : permissions[modelName].actions[actionName].allowed,
          };
        });
      }
    });

    return permissions;
  }

  _setTeamsACLPermissions(permissions) {
    const newFormatPermissions = permissions
      ? PermissionsChecker.transformPermissionsFromOldToNewFormat(permissions)
      : null;

    PermissionsChecker.permissions.renderings[this.renderingId] = {
      data: newFormatPermissions,
      lastRetrieve: moment(),
    };
  }

  // For the rolesACL format, the "searchToEdit" permission is not given as it is assumed that
  // it is strictly equal to the "browseEnabled" permission.
  static addSearchToEditValueToRolesACLPermissions(collectionsPermissions) {
    Object.keys(collectionsPermissions).forEach((modelName) => {
      collectionsPermissions[modelName].collection = {
        ...collectionsPermissions[modelName].collection,
        searchToEdit: collectionsPermissions[modelName].collection.browseEnabled,
      };
    });
    return collectionsPermissions;
  }

  _setRolesACLPermissions(permissions) {
    const updatedCollectionsPermissions = PermissionsChecker
      .addSearchToEditValueToRolesACLPermissions(permissions.collections);

    PermissionsChecker.permissions.collections = {
      data: updatedCollectionsPermissions,
      lastRetrieve: moment(),
    };
    PermissionsChecker.permissions.renderings[this.renderingId] = {
      data: permissions.renderings ? permissions.renderings[this.renderingId] : null,
      lastRetrieve: moment(),
    };
  }

  _setPermissions(permissions) {
    if (PermissionsChecker.isrolesACLActivated) {
      this._setRolesACLPermissions(permissions);
    } else {
      this._setTeamsACLPermissions(permissions);
    }
  }

  static getLastRetrieveTime(renderingId, permissionName) {
    // In the case of rolesACL format and browseEnabled permission, the last retrieve to be taken
    // into account is the one stored by rendering (because of the scope information).
    if (PermissionsChecker.isrolesACLActivated && permissionName !== 'browseEnabled') {
      return PermissionsChecker.permissions.collections.lastRetrieve;
    }
    return PermissionsChecker.permissions.renderings[renderingId]
      ? PermissionsChecker.permissions.renderings[renderingId].lastRetrieve
      : null;
  }

  static resetExpiration(renderingId) {
    if (PermissionsChecker.isrolesACLActivated && PermissionsChecker.permissions.collection) {
      PermissionsChecker.permissions.collection.lastRetrieve = null;
    }

    if (PermissionsChecker.permissions.renderings[renderingId]) {
      PermissionsChecker.permissions.renderings[renderingId].lastRetrieve = null;
    }
  }

  static _isPermissionAllowed(permissionValue, userId) {
    return Array.isArray(permissionValue)
      ? permissionValue.includes(parseInt(userId, 10))
      : permissionValue;
  }

  static _isSmartActionAllowed(smartActionsPermissions, permissionInfos) {
    if (!permissionInfos
      || !permissionInfos.userId
      || !permissionInfos.actionName
      || !smartActionsPermissions
      || !smartActionsPermissions[permissionInfos.actionName]) {
      return false;
    }

    const { userId, actionName } = permissionInfos;
    const { triggerEnabled } = smartActionsPermissions[actionName];

    return PermissionsChecker._isPermissionAllowed(triggerEnabled, userId);
  }

  // NOTICE: Compute a scope to replace $currentUser variables with
  //         the actual user values. This will generate the expected
  //         conditions filters when applied on the server scope response
  static _computeConditionFiltersFromScope(userId, scope) {
    const computedConditionFilters = _.clone(scope.filter);
    computedConditionFilters.conditions.forEach((condition) => {
      if (condition.value
        && `${condition.value}`.startsWith('$')
        && scope.dynamicScopesValues.users[userId]) {
        condition.value = scope
          .dynamicScopesValues
          .users[userId][condition.value];
      }
    });
    return computedConditionFilters;
  }

  static _isAggregationFromScope(aggregator, conditions, expectedConditionFilters) {
    const filtredConditions = conditions.filter(Boolean);
    // NOTICE: Exit case - filtredConditions[0] should be the scope
    if (filtredConditions.length === 1
      && filtredConditions[0].aggregator
      && aggregator === 'and') {
      return filtredConditions[0];
    }

    // NOTICE: During the tree travel, check if `conditions` & `aggregator`
    //         match with expectations
    return filtredConditions.length === expectedConditionFilters.conditions.length
      && (aggregator === expectedConditionFilters.aggregator || aggregator === 'and')
      ? { aggregator, conditions: filtredConditions }
      : null;
  }

  // NOTICE: Check if `expectedConditionFilters` at least contains a definition of
  //         `actualConditionFilters`
  static _isConditionFromScope(actualFilterCondition, expectedFilterConditions) {
    return expectedFilterConditions.filter((expectedCondition) =>
      expectedCondition.value === actualFilterCondition.value
      && expectedCondition.operator === actualFilterCondition.operator
      && expectedCondition.field === actualFilterCondition.field).length > 0;
  }

  static async _isScopeValid(permissionInfos, scope) {
    const expectedConditionFilters = PermissionsChecker
      ._computeConditionFiltersFromScope(permissionInfos.userId, scope);

    // NOTICE: Find aggregated condition. filtredConditions represent an array
    //         of conditions that were tagged based on if it is present in the
    //         scope
    const isScopeAggregation = (aggregator, conditions) => PermissionsChecker
      ._isAggregationFromScope(aggregator, conditions, expectedConditionFilters);

    // NOTICE: Find in a condition correspond to a scope condition or not
    const isScopeCondition = (condition) => PermissionsChecker
      ._isConditionFromScope(condition, expectedConditionFilters.conditions);

    // NOTICE: Perform a travel to find the scope in filters
    const scopeFound = await parseFilters(
      permissionInfos.filters,
      isScopeAggregation,
      isScopeCondition,
    );

    // NOTICE: In the case of only one expected condition, server will still send an aggregator
    //         which will not match the request. If one condition is found and is from scope
    //         then the request is valid
    const isValidSingleConditionScope = !!scopeFound
    && expectedConditionFilters.conditions.length === 1;

    const isSameScope = !!scopeFound
    && scopeFound.aggregator === expectedConditionFilters.aggregator
    && !!scopeFound.conditions
    && scopeFound.conditions.length === expectedConditionFilters.conditions.length;

    return isValidSingleConditionScope || isSameScope;
  }

  static async _isCollectionBrowseAllowed(collectionPermissions, permissionInfos, scope) {
    const { browseEnabled } = collectionPermissions.collection;
    const { userId } = permissionInfos;

    if ((Array.isArray(browseEnabled) && !browseEnabled.includes(parseInt(userId, 10)))
      || !browseEnabled) {
      return false;
    }
    if (!scope) return true;

    try {
      return PermissionsChecker._isScopeValid(permissionInfos, scope);
    } catch (error) {
      logger.error(error);
      return false;
    }
  }

  async _isAllowed(collectionName, permissionName, permissionInfos) {
    const collectionsPermissions = PermissionsChecker.getCollectionsPermissions(this.renderingId);

    if (!collectionsPermissions
      || !collectionsPermissions[collectionName]
      || !collectionsPermissions[collectionName].collection) {
      return false;
    }

    switch (permissionName) {
      case 'actions':
        return PermissionsChecker._isSmartActionAllowed(
          collectionsPermissions[collectionName].actions,
          permissionInfos,
        );
      case 'browseEnabled':
        return PermissionsChecker._isCollectionBrowseAllowed(
          collectionsPermissions[collectionName],
          permissionInfos,
          this._getScopePermissions(collectionName),
        );
      default:
        return PermissionsChecker._isPermissionAllowed(
          collectionsPermissions[collectionName].collection[permissionName],
          permissionInfos.userId,
        );
    }
  }

  async _retrievePermissions() {
    return forestServerRequester
      .perform('/liana/v3/permissions', this.environmentSecret, { renderingId: this.renderingId })
      .then((responseBody) => {
        PermissionsChecker.isrolesACLActivated = responseBody.meta
          ? responseBody.meta.rolesACLActivated
          : false;
        this._setPermissions(responseBody.data);
      })
      .catch((error) => P.reject(new VError(error, 'Permissions error')));
  }

  _isPermissionExpired(permissionName) {
    const currentTime = moment();
    const lastRetrieve = PermissionsChecker.getLastRetrieveTime(this.renderingId, permissionName);

    if (!lastRetrieve) {
      return true;
    }

    const elapsedSeconds = currentTime.diff(lastRetrieve, 'seconds');
    return elapsedSeconds >= PermissionsChecker.expirationInSeconds;
  }

  async _retrievePermissionsAndCheckAllowed(collectionName, permissionName, permissionInfos) {
    await this._retrievePermissions();
    const allowed = await this._isAllowed(collectionName, permissionName, permissionInfos);
    if (!allowed) {
      throw new Error(`'${permissionName}' access forbidden on ${collectionName}`);
    }
  }

  async checkPermissions(collectionName, permissionName, permissionInfos) {
    // TODO IN NEXT PR: Distinguish collectionsPermissionExpired and scopePermissionExpired for
    // rolesACL format and retrieve only scope when needed.
    if (this._isPermissionExpired(permissionName)) {
      return this._retrievePermissionsAndCheckAllowed(
        collectionName,
        permissionName,
        permissionInfos,
      );
    }

    if (!(await this._isAllowed(collectionName, permissionName, permissionInfos))) {
      return this._retrievePermissionsAndCheckAllowed(
        collectionName,
        permissionName,
        permissionInfos,
      );
    }
    return null;
  }
}

module.exports = PermissionsChecker;
