
const _transformActionsPermissionsFromOldToNewFormat = (smartActionsPermissions) => {
  const newSmartActionsPermissions = {};
  Object.keys(smartActionsPermissions).forEach((actionName) => {
    const action = smartActionsPermissions[actionName];
    newSmartActionsPermissions[actionName] = {
      triggerEnabled: action.users ? action.allowed && action.users : action.allowed,
    };
  });
  return newSmartActionsPermissions;
};

const transformPermissionsFromOldToNewFormat = (permissions) => {
  const newPermissions = {};

  Object.keys(permissions).forEach((modelName) => {
    const modelPermissions = permissions[modelName];
    const { collection } = modelPermissions;

    newPermissions[modelName] = {
      collection: {
        browseEnabled: collection.list || collection.searchToEdit,
        readEnabled: collection.show,
        editEnabled: collection.update,
        addEnabled: collection.create,
        deleteEnabled: collection.delete,
        exportEnabled: collection.export,
      },
      scope: modelPermissions.scope,
      segments: modelPermissions.segments,
    };

    if (modelPermissions.actions) {
      newPermissions[modelName]
        .actions = _transformActionsPermissionsFromOldToNewFormat(modelPermissions.actions);
    }
  });

  return newPermissions;
};

module.exports = {
  transformPermissionsFromOldToNewFormat,
};
