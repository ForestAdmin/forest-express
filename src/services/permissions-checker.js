const _ = require('lodash');
const { perform: parseFilters } = require('./base-filters-parser');
const logger = require('./logger');
const PermissionsCache = require('./permissions-cache');

class PermissionsChecker {
  constructor(environmentSecret, renderingId) {
    this.environmentSecret = environmentSecret;
    this.renderingId = renderingId;
  }

  static _isPermissionAllowed(permissionValue, userId) {
    return Array.isArray(permissionValue)
      ? permissionValue.includes(Number.parseInt(userId, 10))
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

  // Compute a scope to replace $currentUser variables with the actual user values. This will
  // generate the expected conditions filters when applied on the server scope response.
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
    // Exit case - filtredConditions[0] should be the scope
    if (filtredConditions.length === 1
      && filtredConditions[0].aggregator
      && aggregator === 'and') {
      return filtredConditions[0];
    }

    // During the tree travel, check if `conditions` & `aggregator` match with expectations
    return filtredConditions.length === expectedConditionFilters.conditions.length
      && (aggregator === expectedConditionFilters.aggregator || aggregator === 'and')
      ? { aggregator, conditions: filtredConditions }
      : null;
  }

  // Check if `expectedConditionFilters` at least contains a definition of `actualConditionFilters`
  static _isConditionFromScope(actualFilterCondition, expectedFilterConditions) {
    return expectedFilterConditions.filter((expectedCondition) =>
      expectedCondition.value === actualFilterCondition.value
      && expectedCondition.operator === actualFilterCondition.operator
      && expectedCondition.field === actualFilterCondition.field).length > 0;
  }

  static async _isScopeValid(permissionInfos, scope) {
    const expectedConditionFilters = PermissionsChecker
      ._computeConditionFiltersFromScope(permissionInfos.userId, scope);

    // Find aggregated condition. filtredConditions represent an array of conditions that were
    // tagged based on if it is present in the scope
    const isScopeAggregation = (aggregator, conditions) => PermissionsChecker
      ._isAggregationFromScope(aggregator, conditions, expectedConditionFilters);

    // Find in a condition correspond to a scope condition or not
    const isScopeCondition = (condition) => PermissionsChecker
      ._isConditionFromScope(condition, expectedConditionFilters.conditions);

    // Perform a travel to find the scope in filters
    const scopeFound = await parseFilters(
      permissionInfos.filters,
      isScopeAggregation,
      isScopeCondition,
    );

    // In the case of only one expected condition, server will still send an aggregator which will
    // not match the request. If one condition is found and is from scope then the request is valid
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

    if (!PermissionsChecker._isPermissionAllowed(browseEnabled, userId)) return false;
    if (!scope) return true;

    try {
      return PermissionsChecker._isScopeValid(permissionInfos, scope);
    } catch (error) {
      logger.error(error);
      return false;
    }
  }

  async _isAllowed(collectionName, permissionName, permissionInfos) {
    const collectionsPermissions = PermissionsCache.getPermissions(this.renderingId);

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
          PermissionsCache.getScopePermissions(this.renderingId, collectionName),
        );
      default:
        return PermissionsChecker._isPermissionAllowed(
          collectionsPermissions[collectionName].collection[permissionName],
          permissionInfos.userId,
        );
    }
  }

  async _retrievePermissionsAndCheckAllowed(collectionName, permissionName, permissionInfos) {
    await PermissionsCache.retrievePermissions(this.environmentSecret, this.renderingId);
    const allowed = await this._isAllowed(collectionName, permissionName, permissionInfos);
    if (!allowed) {
      throw new Error(`'${permissionName}' access forbidden on ${collectionName}`);
    }
  }

  async checkPermissions(collectionName, permissionName, permissionInfos) {
    // TODO IN NEXT PR: Distinguish collectionsPermissionExpired and scopePermissionExpired for
    // rolesACL format and retrieve only scope when needed.
    if (PermissionsCache.isPermissionExpired(this.renderingId, permissionName)) {
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
