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

  // This permissionsPerRendering is the cache, shared by all instances of PermissionsChecker.
  static permissionsPerRendering = {};

  static cleanCache() {
    PermissionsChecker.permissionsPerRendering = {};
  }

  static getPermissions(renderingId) {
    return PermissionsChecker.permissionsPerRendering[renderingId];
  }

  static _setPermissionsInRendering(renderingId, permissions) {
    PermissionsChecker.permissionsPerRendering[renderingId] = permissions;
  }

  static getLastRetrieveTime(renderingId) {
    const permissions = PermissionsChecker.getPermissions(renderingId);
    return permissions ? permissions.lastRetrieve : null;
  }

  static resetExpiration(renderingId) {
    const permissions = PermissionsChecker.getPermissions(renderingId);
    if (permissions) {
      permissions.lastRetrieve = null;
    }
  }

  static _isSmartActionAllowed(smartActionsPermissions, permissionInfos) {
    if (!permissionInfos
      || !permissionInfos.userId
      || !permissionInfos.actionId
      || !smartActionsPermissions
      || !smartActionsPermissions[permissionInfos.actionId]) {
      return false;
    }

    const { userId, actionId } = permissionInfos;
    const { allowed, users } = smartActionsPermissions[actionId];

    return allowed && (!users || users.includes(parseInt(userId, 10)));
  }

  // NOTICE: Compute a scope to replace $currentUser variables with
  //         the actual user values. This will generate the expected
  //         conditions filters when applied on the server scope response
  static _computeConditionFiltersFromScope(userId, collectionListScope) {
    const computedConditionFilters = _.clone(collectionListScope.filter);
    computedConditionFilters.conditions.forEach((condition) => {
      if (condition.value
        && `${condition.value}`.startsWith('$')
        && collectionListScope.dynamicScopesValues.users[userId]) {
        condition.value = collectionListScope
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

  static async _isCollectionListAllowed(collectionList, permissionInfos) {
    if (!collectionList.collection.list) return false;
    if (!collectionList.scope) return true;

    try {
      const expectedConditionFilters = PermissionsChecker
        ._computeConditionFiltersFromScope(permissionInfos.userId, collectionList.scope);

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
    } catch (error) {
      logger.error(error);
      return false;
    }
  }

  async _isAllowed(collectionName, permissionName, permissionInfos) {
    const permissions = PermissionsChecker.getPermissions(this.renderingId);

    if (!permissions
      || !permissions.data
      || !permissions.data[collectionName]
      || !permissions.data[collectionName].collection) {
      return false;
    }

    if (permissionName === 'actions') {
      return PermissionsChecker._isSmartActionAllowed(
        permissions.data[collectionName].actions,
        permissionInfos,
      );
    }
    if (permissionName === 'list') {
      return PermissionsChecker._isCollectionListAllowed(
        permissions.data[collectionName],
        permissionInfos,
      );
    }
    return permissions.data[collectionName].collection[permissionName];
  }

  _retrievePermissions() {
    return forestServerRequester
      .perform('/liana/v3/permissions', this.environmentSecret, { renderingId: this.renderingId })
      .then((responseBody) => {
        PermissionsChecker._setPermissionsInRendering(
          this.renderingId,
          { data: responseBody.data, lastRetrieve: moment() },
        );
      })
      .catch((error) => P.reject(new VError(error, 'Permissions error')));
  }

  _isPermissionExpired() {
    const currentTime = moment();
    const lastRetrieve = PermissionsChecker.getLastRetrieveTime(this.renderingId);

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
    if (this._isPermissionExpired()) {
      return this._retrievePermissionsAndCheckAllowed(
        collectionName,
        permissionName,
        permissionInfos,
      );
    }

    if (!(await this._isAllowed(collectionName, permissionName))) {
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
