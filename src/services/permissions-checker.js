const P = require('bluebird');
const moment = require('moment');
const VError = require('verror');
const _ = require('lodash');
const { perform } = require('./base-filters-parser');
const context = require('../context');

let permissionsPerRendering = {};

function PermissionsChecker(
  environmentSecret,
  renderingId,
  collectionName,
  permissionName,
  permissionInfos = undefined,
) {
  const { forestServerRequester } = context.inject();

  const EXPIRATION_IN_SECONDS = process.env.FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS || 3600;

  function isSmartActionAllowed(smartActionsPermissions) {
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
  function computeConditionFiltersFromScope(userId, collectionListScope) {
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
  function isConditionFromScope(expectedFilterConditions, actualFilterCondition) {
    return expectedFilterConditions.filter((expectedCondition) =>
      expectedCondition.value === actualFilterCondition.value
      && expectedCondition.operator === actualFilterCondition.operator
      && expectedCondition.field === actualFilterCondition.field).length > 0;
  }

  async function isCollectionListAllowed(collectionListScope) {
    if (!collectionListScope) {
      return true;
    }

    try {
      const expectedConditionFilters = computeConditionFiltersFromScope(
        permissionInfos.userId,
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
        isConditionFromScope(expectedConditionFilters.conditions, condition);
      // NOTICE: Perform a travel to find the scope in filters
      const scopeFound = await perform(
        permissionInfos.filters,
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

  async function isAllowed() {
    const permissions = permissionsPerRendering[renderingId]
      && permissionsPerRendering[renderingId].data;

    if (!permissions || !permissions[collectionName] || !permissions[collectionName].collection) {
      return false;
    }

    if (permissionName === 'actions') {
      return isSmartActionAllowed(permissions[collectionName].actions);
    }
    if (permissionName === 'list' && permissions[collectionName].collection[permissionName]) {
      return isCollectionListAllowed(permissions[collectionName].scope);
    }
    return permissions[collectionName].collection[permissionName];
  }

  function retrievePermissions() {
    return forestServerRequester
      .perform('/liana/v2/permissions', environmentSecret, { renderingId })
      .then((responseBody) => {
        permissionsPerRendering[renderingId] = {
          data: responseBody,
          lastRetrieve: moment(),
        };
      })
      .catch((error) => P.reject(new VError(error, 'Permissions error')));
  }

  function isPermissionExpired() {
    if (!permissionsPerRendering[renderingId]
      || !permissionsPerRendering[renderingId].lastRetrieve) {
      return true;
    }

    const { lastRetrieve } = permissionsPerRendering[renderingId];
    const currentTime = moment();

    if (!lastRetrieve) {
      return true;
    }

    const elapsedSeconds = currentTime.diff(lastRetrieve, 'seconds');

    return elapsedSeconds >= EXPIRATION_IN_SECONDS;
  }

  async function retrievePermissionsAndCheckAllowed() {
    await retrievePermissions();
    const allowed = await isAllowed();
    if (!allowed) {
      throw new Error(`'${permissionName}' access forbidden on ${collectionName}`);
    }
  }

  this.perform = async () => {
    if (isPermissionExpired()) {
      return retrievePermissionsAndCheckAllowed();
    }

    if (!(await isAllowed(collectionName, permissionName))) {
      return retrievePermissionsAndCheckAllowed();
    }
    return Promise.resolve();
  };
}

PermissionsChecker.cleanCache = () => {
  permissionsPerRendering = {};
};

PermissionsChecker.resetExpiration = (renderingId) => {
  const permissions = permissionsPerRendering[renderingId]
    && permissionsPerRendering[renderingId].data;

  if (permissions) {
    permissions.lastRetrieve = null;
  }
};

PermissionsChecker.getLastRetrieveTime = (renderingId) => {
  if (!permissionsPerRendering[renderingId]) {
    return null;
  }

  return permissionsPerRendering[renderingId].lastRetrieve;
};

PermissionsChecker.getPermissions = (renderingId) => {
  if (!permissionsPerRendering[renderingId]) {
    return null;
  }

  return permissionsPerRendering[renderingId].data;
};

module.exports = PermissionsChecker;
