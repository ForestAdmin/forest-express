import { ForestAdminClientOptions, ForestAdminClientOptionsWithDefaults } from '@forestadmin/forestadmin-client/dist/types';
import ActionPermissionService from '@forestadmin/forestadmin-client/dist/permissions/action-permission';
import UserPermissionService from '@forestadmin/forestadmin-client/dist/permissions/user-permission';
import ForestAdminClientForForestExpress from './forest-admin-client';
import RenderingPermissionServiceForForestExpress from './rendering-permissions';

export default function createForestAdminClient(
  options: ForestAdminClientOptions,
): ForestAdminClientForForestExpress {
  const optionsWithDefaults: ForestAdminClientOptionsWithDefaults = {
    forestServerUrl: 'https://api.forestadmin.com',
    permissionsCacheDurationInSeconds: 15 * 60,
    // eslint-disable-next-line no-console
    logger: (level, ...args) => console[level.toLowerCase()](...args),
    ...options,
  };

  return new ForestAdminClientForForestExpress(
    optionsWithDefaults,
    new ActionPermissionService(optionsWithDefaults),
    new RenderingPermissionServiceForForestExpress(
      optionsWithDefaults,
      new UserPermissionService(optionsWithDefaults),
    ),
  );
}
