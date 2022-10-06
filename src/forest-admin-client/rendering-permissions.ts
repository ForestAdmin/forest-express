import RenderingPermissionService, { RenderingPermission } from '@forestadmin/forestadmin-client/dist/permissions/rendering-permission';
import { CollectionSegment } from '@forestadmin/forestadmin-client/dist/permissions/types';

export default class RenderingPermissionServiceForForestExpress extends RenderingPermissionService {
  public async getSegments({
    renderingId,
    collectionName,
  }: {
    renderingId: number | string;
    collectionName: string;
  }): Promise<CollectionSegment[] | null> {
    return this.getSegmentsOrRetry({ renderingId, collectionName, allowRetry: true });
  }

  private async getSegmentsOrRetry({
    renderingId,
    collectionName,
    allowRetry,
  }: {
    renderingId: number | string;
    collectionName: string;
    allowRetry: boolean;
  }): Promise<CollectionSegment[] | null> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const permissions: RenderingPermission = (await this.permissionsByRendering.fetch(`${renderingId}`)) as RenderingPermission;

    const collectionPermissions = permissions?.collections?.[collectionName];

    if (!collectionPermissions || collectionPermissions.segments.length === 0) {
      if (allowRetry) {
        this.invalidateCache(renderingId);

        return this.getSegmentsOrRetry({ renderingId, collectionName, allowRetry: false });
      }

      return null;
    }

    return collectionPermissions.segments;
  }
}
