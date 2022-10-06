import { ForestAdminClientOptions, ForestAdminClientOptionsWithDefaults } from '@forestadmin/forestadmin-client/dist/types';
import ActionPermissionService from '@forestadmin/forestadmin-client/dist/permissions/action-permission';
import ForestAdminClientForForestExpress from './forest-admin-client';
import RenderingPermissionServiceForForestExpress from './rendering-permissions';
import UserPermissionService from '@forestadmin/forestadmin-client/dist/permissions/user-permission';

export default function createForestAdminClient(
  options: ForestAdminClientOptions,
): ForestAdminClientForForestExpress {
  console.log(options);
  const optionsWithDefaults: ForestAdminClientOptionsWithDefaults = {
    forestServerUrl: 'https://api.forestadmin.com',
    permissionsCacheDurationInSeconds: 15 * 60,
    logger: (level, ...args) => (console as any)[level.toLowerCase()](...args),
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
