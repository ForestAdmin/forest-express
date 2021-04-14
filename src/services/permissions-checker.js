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

  static _isLiveQueryAllowed(liveQueriesPermissions, permissionInfos) {
    return liveQueriesPermissions.includes(permissionInfos);
  }

  static _isStatWithParametersAllowed(statsPermissions, permissionInfos) {
    const permissionsPool = statsPermissions[`${permissionInfos.type.toLowerCase()}s`];

    const arrayPermissionInfos = Object.values(permissionInfos);

    return permissionsPool.some((statPermission) => {
      const arrayStatPermission = Object.values(statPermission);
      return arrayPermissionInfos.every((info) => arrayStatPermission.includes(info));
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async _isCollectionBrowseAllowed(collectionPermissions, permissionInfos) {
    return collectionPermissions
      && permissionInfos
      && PermissionsChecker
        ._isPermissionAllowed(collectionPermissions.browseEnabled, permissionInfos.userId);
  }

  async _isAllowed(permissions, permissionName, permissionInfos) {
    switch (permissionName) {
      case 'actions':
        return PermissionsChecker._isSmartActionAllowed(permissions.actions, permissionInfos);
      case 'browseEnabled':
        return this._isCollectionBrowseAllowed(permissions.collection, permissionInfos);
      case 'liveQueries':
        return PermissionsChecker._isLiveQueryAllowed(permissions.stats.queries, permissionInfos);
      case 'statWithParameters':
        return PermissionsChecker._isStatWithParametersAllowed(permissions.stats, permissionInfos);

      default:
        return permissions.collection
          ? PermissionsChecker
            ._isPermissionAllowed(permissions.collection[permissionName], permissionInfos.userId)
          : null;
    }
  }

  async checkPermissions(
    renderingId, collectionName, permissionName, permissionInfos, environmentId = undefined,
  ) {
    const getPermissions = async (forceRetrieve) => this.permissionsGetter.getPermissions(
      renderingId, collectionName, permissionName, { forceRetrieve, environmentId },
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
