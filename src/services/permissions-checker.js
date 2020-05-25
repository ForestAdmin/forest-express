const P = require('bluebird');
const moment = require('moment');
const VError = require('verror');
const _ = require('lodash');
const forestServerRequester = require('./forest-server-requester');
const { perform } = require('./base-filters-parser');

let permissionsPerRendering = {};

function PermissionsChecker(
  environmentSecret,
  renderingId,
  collectionName,
  permissionName,
  smartActionParameters = undefined,
  collectionListRequest = undefined,
) {
  const EXPIRATION_IN_SECONDS = process.env.FOREST_PERMISSIONS_EXPIRATION_IN_SECONDS || 3600;

  function isSmartActionAllowed(smartActionsPermissions) {
    if (!smartActionParameters
      || !smartActionParameters.userId
      || !smartActionParameters.actionId
      || !smartActionsPermissions
      || !smartActionsPermissions[smartActionParameters.actionId]) {
      return false;
    }

    const { userId, actionId } = smartActionParameters;
    const { allowed, users } = smartActionsPermissions[actionId];

    return allowed && (!users || users.includes(parseInt(userId, 10)));
  }

  // NOTICE: Compute a scope to replace $currentUser variables with
  //         the actual user values. This will generate the expected
  //         conditions filters when applied on the server scope response
  function computeConditionFiltersFromScope(userId, collectionListScope) {
    const computedConditionFilters = _.clone(collectionListScope.filter);
    computedConditionFilters.conditions.forEach((condition) => {
      if (condition.value.startsWith('$')) {
        condition.value = collectionListScope
          .dynamicScopesValues
          .users[userId][condition.value];
      }
    });
    delete computedConditionFilters.dynamicScopesValues;
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
    if (collectionListScope) {
      const expectedConditionFilters = computeConditionFiltersFromScope(
        collectionListRequest.userId,
        collectionListScope,
      );

      const formatAggregation = (aggregator, conditions) => {
        const areConditionsFromScopes = conditions.every((condition) => condition.isFromScope);
        if (areConditionsFromScopes && aggregator === expectedConditionFilters.aggregator) {
          return { aggregator, conditions, isFromScope: true };
        }
        return { aggregator, conditions };
      };

      const formatCondition = (condition) => ({
        ...condition,
        isFromScope: isConditionFromScope(expectedConditionFilters.conditions, condition),
      });
      // NOTICE: Perform a travel to find the scope in filters
      const parsedFilters = await perform(
        collectionListRequest.filters,
        formatAggregation,
        formatCondition,
      );

      return parsedFilters.isFromScope
        || (parsedFilters.conditions
          && parsedFilters.aggregator === 'and'
          && parsedFilters.conditions.find((condition) => condition.isFromScope));
    }
    return true;
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
    const ok = await isAllowed();
    if (!ok) {
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
