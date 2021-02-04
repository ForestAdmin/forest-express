const { clone } = require('lodash');

class PermissionsChecker {
  constructor({ baseFilterParser, logger, permissionsGetter }) {
    this.baseFilterParser = baseFilterParser;
    this.logger = logger;
    this.permissionsGetter = permissionsGetter;
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
    const computedConditionFilters = clone(scope.filter);
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

  async _isScopeValid(permissionInfos, scope) {
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
    const scopeFound = await this.baseFilterParser.perform(
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

  async _isCollectionBrowseAllowed(collectionPermissions, permissionInfos, scope) {
    if (!collectionPermissions
      || !permissionInfos
      || !PermissionsChecker
        ._isPermissionAllowed(collectionPermissions.browseEnabled, permissionInfos.userId)) {
      return false;
    }

    if (!scope) return true;

    try {
      return this._isScopeValid(permissionInfos, scope);
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  async _isAllowed(permissions, permissionName, permissionInfos) {
    switch (permissionName) {
      case 'actions':
        return PermissionsChecker._isSmartActionAllowed(permissions.actions, permissionInfos);
      case 'browseEnabled':
        return this._isCollectionBrowseAllowed(
          permissions.collection, permissionInfos, permissions.scope,
        );
      default:
        return permissions.collection
          ? PermissionsChecker
            ._isPermissionAllowed(permissions.collection[permissionName], permissionInfos.userId)
          : null;
    }
  }

  async checkPermissions(
    renderingId, collectionName, permissionName, permissionInfos, storePermissionsInto = undefined,
  ) {
    const getPermissions = async (forceRetrieve) => this.permissionsGetter.getPermissions(
      renderingId, collectionName, permissionName, { forceRetrieve, storePermissionsInto },
    );
    const isAllowed = async ({ forceRetrieve = false } = {}) => this._isAllowed(
      await getPermissions(forceRetrieve),
      permissionName,
      permissionInfos,
    );

    if (await isAllowed() || await isAllowed({ forceRetrieve: true })) {
      return null;
    }

    throw new Error(`'${permissionName}' access forbidden on ${collectionName}`);
  }
}

module.exports = PermissionsChecker;
