const LIVE_QUERY_ALLOWED_PERMISSION_LEVELS = ['admin', 'editor', 'developer'];

class PermissionsChecker {
  constructor({ logger, permissionsGetter }) {
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

  static _isLiveQueryAllowed(liveQueriesPermissions, permissionInfos, user) {
    return LIVE_QUERY_ALLOWED_PERMISSION_LEVELS.includes(user.permissionLevel)
    || liveQueriesPermissions.includes(permissionInfos);
  }

  static _isStatWithParametersAllowed(statsPermissions, permissionInfos, user) {
    const permissionsPool = statsPermissions[`${permissionInfos.type.toLowerCase()}s`];

    const arrayPermissionInfos = Object.values(permissionInfos);

    return LIVE_QUERY_ALLOWED_PERMISSION_LEVELS.includes(user.permissionLevel)
    || permissionsPool.some((statPermission) => {
      const arrayStatPermission = Object.values(statPermission);
      return arrayPermissionInfos.every((info) => arrayStatPermission.includes(info));
    });
  }

  static async _isCollectionBrowseAllowed(permissions, permissionInfos) {
    const { collection: collectionPermissions, segments } = permissions;

    // NOTICE: Security - Segment Query check additional permission
    if (permissionInfos.segmentQuery) {
      // NOTICE: The segmentQuery should be in the segments
      if (!segments) {
        return false;
      }

      // NOTICE: Handle UNION queries made by the FRONT to display available actions on details view
      const unionQueries = permissionInfos.segmentQuery.split('/*MULTI-SEGMENTS-QUERIES-UNION*/ UNION ');
      if (unionQueries.length > 1) {
        const includesAllowedQueriesOnly = unionQueries.every((unionQuery) => segments.filter((query) => query.replace(/;\s*/i, '') === unionQuery).length > 0);
        if (!includesAllowedQueriesOnly) {
          return false;
        }
      } else if (!segments.includes(permissionInfos.segmentQuery)) {
        return false;
      }
    }

    return collectionPermissions
      && permissionInfos
      && PermissionsChecker
        ._isPermissionAllowed(collectionPermissions.browseEnabled, permissionInfos.userId);
  }

  static async _isAllowed(permissions, permissionName, permissionInfos, user) {
    switch (permissionName) {
      case 'actions':
        return PermissionsChecker._isSmartActionAllowed(permissions.actions, permissionInfos);

      case 'browseEnabled':
        return PermissionsChecker
          ._isCollectionBrowseAllowed(permissions, permissionInfos);

      case 'liveQueries':
        return PermissionsChecker
          ._isLiveQueryAllowed(permissions.stats.queries, permissionInfos, user);

      case 'statWithParameters':
        return PermissionsChecker
          ._isStatWithParametersAllowed(permissions.stats, permissionInfos, user);

      default:
        return permissions.collection
          ? PermissionsChecker
            ._isPermissionAllowed(permissions.collection[permissionName], permissionInfos.userId)
          : null;
    }
  }

  async checkPermissions(
    user, collectionName, permissionName, permissionInfos, environmentId = undefined,
  ) {
    const getPermissions = async (forceRetrieve) => this.permissionsGetter.getPermissions(
      user.renderingId, collectionName, permissionName, { forceRetrieve, environmentId },
    );

    const isAllowed = async ({ forceRetrieve = false } = {}) => PermissionsChecker._isAllowed(
      await getPermissions(forceRetrieve),
      permissionName,
      permissionInfos,
      user,
    );

    if (await isAllowed() || await isAllowed({ forceRetrieve: true })) {
      return null;
    }

    if (permissionName === 'liveQueries') {
      throw new Error('Chart with SQL access forbidden - You are not allow to run this query');
    }
    if (permissionName === 'statWithParameters') {
      throw new Error('Simple Chart access forbidden - You are not allow to display this chart');
    }

    throw new Error(`'${permissionName}' access forbidden on ${collectionName}`);
  }
}

module.exports = PermissionsChecker;
