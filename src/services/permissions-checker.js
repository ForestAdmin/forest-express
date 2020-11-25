const P = require('bluebird');
const moment = require('moment');
const VError = require('verror');
const _ = require('lodash');
const forestServerRequester = require('./forest-server-requester');
const { perform } = require('./base-filters-parser');

const EXPIRATION_IN_SECONDS = process.env.FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS || 3600;

class PermissionsChecker {
  constructor(
    environmentSecret, renderingId, collectionName, permissionName, permissionInfos = undefined,
  ) {
    this.environmentSecret = environmentSecret;
    this.renderingId = renderingId;
    this.collectionName = collectionName;
    this.permissionName = permissionName;
    this.permissionInfos = permissionInfos;
  }

  static expirationInSeconds = EXPIRATION_IN_SECONDS;

  // This permissionsPerRendering is the cache, shared by all instances of PermissionsChecker.
  static permissionsPerRendering = {};

  _isSmartActionAllowed(smartActionsPermissions) {
    if (!this.permissionInfos
      || !this.permissionInfos.userId
      || !this.permissionInfos.actionId
      || !smartActionsPermissions
      || !smartActionsPermissions[this.permissionInfos.actionId]) {
      return false;
    }

    const { userId, actionId } = this.permissionInfos;
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

  // NOTICE: Check if `expectedConditionFilters` at least contains a definition of
  //         `actualConditionFilters`
  static _isConditionFromScope(expectedFilterConditions, actualFilterCondition) {
    return expectedFilterConditions.filter((expectedCondition) =>
      expectedCondition.value === actualFilterCondition.value
      && expectedCondition.operator === actualFilterCondition.operator
      && expectedCondition.field === actualFilterCondition.field).length > 0;
  }

  async _isCollectionListAllowed(collectionListScope) {
    if (!collectionListScope) {
      return true;
    }

    try {
      const expectedConditionFilters = PermissionsChecker._computeConditionFiltersFromScope(
        this.permissionInfos.userId,
        collectionListScope,
      );
        // NOTICE: Find aggregated condition. filtredConditions represent an array
        //         of conditions that were tagged based on if it is present in the
        //         scope
      const isScopeAggregation = (aggregator, conditions) => {
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
      };

      // NOTICE: Find in a condition correspond to a scope condition or not
      const isScopeCondition = (condition) =>
        PermissionsChecker._isConditionFromScope(expectedConditionFilters.conditions, condition);
        // NOTICE: Perform a travel to find the scope in filters
      const scopeFound = await perform(
        this.permissionInfos.filters,
        isScopeAggregation,
        isScopeCondition,
      );

      // NOTICE: In the case of only one expected condition, server will still send an aggregator
      //         which will not match the request. If one condition is found and is from scope
      //         then the request is valid
      if (expectedConditionFilters.conditions.length === 1) {
        return scopeFound;
      }

      return scopeFound.aggregator === expectedConditionFilters.aggregator
        && scopeFound.conditions
        && scopeFound.conditions.length === expectedConditionFilters.conditions.length;
    } catch (error) {
      return false;
    }
  }

  async _isAllowed() {
    const permissions = PermissionsChecker.getPermissionsData(this.renderingId);

    if (!permissions || !permissions[this.collectionName]
      || !permissions[this.collectionName].collection) {
      return false;
    }

    if (this.permissionName === 'actions') {
      return this._isSmartActionAllowed(permissions[this.collectionName].actions);
    }
    if (this.permissionName === 'list' && permissions[this.collectionName].collection[this.permissionName]) {
      return this._isCollectionListAllowed(permissions[this.collectionName].scope);
    }
    return permissions[this.collectionName].collection[this.permissionName];
  }

  _retrievePermissions() {
    return forestServerRequester
      .perform('/liana/v2/permissions', this.environmentSecret, { renderingId: this.renderingId })
      .then((responseBody) => {
        PermissionsChecker._setPermissionsInRendering(
          this.renderingId,
          { data: responseBody, lastRetrieve: moment() },
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

  async _retrievePermissionsAndCheckAllowed() {
    await this._retrievePermissions();
    const allowed = await this._isAllowed();
    if (!allowed) {
      throw new Error(`'${this.permissionName}' access forbidden on ${this.collectionName}`);
    }
  }

  static _setPermissionsInRendering(renderingId, objectValue) {
    if (!PermissionsChecker.permissionsPerRendering[renderingId]) {
      PermissionsChecker.permissionsPerRendering[renderingId] = objectValue;
    } else {
      Object.keys(objectValue).forEach((key) => {
        PermissionsChecker.permissionsPerRendering[renderingId][key] = objectValue[key];
      });
    }
  }

  static resetExpiration(renderingId) {
    const lastRetrieve = PermissionsChecker.getLastRetrieveTime(renderingId);

    if (lastRetrieve) {
      PermissionsChecker._setPermissionsInRendering(renderingId, { lastRetrieve: null });
    }
  }

  static getPermissionsData(renderingId) {
    if (!PermissionsChecker.permissionsPerRendering[renderingId]) {
      return null;
    }

    return PermissionsChecker.permissionsPerRendering[renderingId].data;
  }

  static getLastRetrieveTime(renderingId) {
    if (!PermissionsChecker.permissionsPerRendering[renderingId]) {
      return null;
    }

    return PermissionsChecker.permissionsPerRendering[renderingId].lastRetrieve;
  }

  static cleanCache() {
    PermissionsChecker.permissionsPerRendering = {};
  }

  async checkPermissions() {
    if (this._isPermissionExpired()) {
      return this._retrievePermissionsAndCheckAllowed();
    }

    if (!(await this._isAllowed(this.collectionName, this.permissionName))) {
      return this._retrievePermissionsAndCheckAllowed();
    }
    return Promise.resolve();
  }
}

module.exports = PermissionsChecker;
