const _ = require('lodash');
const { perform: parseFilters } = require('./base-filters-parser');
const logger = require('./logger');
const PermissionsGetter = require('./permissions-getter');

class PermissionsChecker {
  constructor(environmentSecret, renderingId) {
    this.environmentSecret = environmentSecret;
    this.renderingId = renderingId;
  }

  static _isPermissionAllowed(permissionValue, userId) {
    return Array.isArray(permissionValue)
      ? permissionValue.includes(Number.parseInt(userId, 10))
      : !!permissionValue;
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
    if (!collectionPermissions
      || !permissionInfos
      || !PermissionsChecker
        ._isPermissionAllowed(collectionPermissions.browseEnabled, permissionInfos.userId)) {
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

  static async _isAllowed(permissions, permissionName, permissionInfos) {
    switch (permissionName) {
      case 'actions':
        return PermissionsChecker._isSmartActionAllowed(permissions.actions, permissionInfos);
      case 'browseEnabled':
        return PermissionsChecker
          ._isCollectionBrowseAllowed(permissions.collection, permissionInfos, permissions.scope);
      default:
        return permissions.collection
          ? PermissionsChecker
            ._isPermissionAllowed(permissions.collection[permissionName], permissionInfos.userId)
          : null;
    }
  }

  async checkPermissions(collectionName, permissionName, permissionInfos) {
    const arePermissionsExpired = PermissionsGetter
      .arePermissionsExpired(this.renderingId, permissionName);
    const areRolesACLRenderingOnlyPermissionsExpired = PermissionsGetter
      .areRolesACLRenderingOnlyPermissionsExpired(this.renderingId, permissionName);
    const permissions = () => PermissionsGetter.getPermissions(this.renderingId, collectionName);
    const isAllowed = async () => PermissionsChecker
      ._isAllowed(permissions(), permissionName, permissionInfos);

    if (!arePermissionsExpired && await isAllowed()) {
      return null;
    }

    if (areRolesACLRenderingOnlyPermissionsExpired) {
      await PermissionsGetter.retrievePermissions(this.environmentSecret, this.renderingId, true);
      if (await isAllowed()) {
        return null;
      }
    }

    await PermissionsGetter.retrievePermissions(this.environmentSecret, this.renderingId);
    if (await isAllowed()) {
      return null;
    }
    throw new Error(`'${permissionName}' access forbidden on ${collectionName}`);
  }
}

module.exports = PermissionsChecker;
