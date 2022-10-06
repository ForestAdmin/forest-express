
import ForestAdminClient from '@forestadmin/forestadmin-client/dist/forest-admin-client';


import { CollectionActionEvent, ManualCollectionSegment } from '@forestadmin/forestadmin-client/dist/permissions/types';
import RenderingPermissionServiceForForestExpress from './rendering-permissions';

export default class ForestAdminClientForForestExpress extends ForestAdminClient {

  public async canBrowse({
    userId,
    collectionName,
    renderingId,
    segmentQuery,
  }: {
    userId: number;
    collectionName: string;
    renderingId: number;
    segmentQuery?: string;
  }): Promise<boolean> {
    return (await this.canOnCollection({
      userId,
      event: CollectionActionEvent.Browse,
      collectionName
    })) && await (this.canBrowseSegment(renderingId, collectionName, segmentQuery));
  }

  private async canBrowseSegment(renderingId: number, collectionName: string, segmentQuery?: string) {
    if (!segmentQuery) {
      return true;
    }

    const segments = await (this.renderingPermissionService as RenderingPermissionServiceForForestExpress)
      .getSegments({
        renderingId,
        collectionName
      }) as ManualCollectionSegment[];

    // NOTICE: The segmentQuery should be in the segments
    if (!segments) {
      return false;
    }

    // NOTICE: Handle UNION queries made by the FRONT to display available actions on details view
    const unionQueries = segmentQuery.split('/*MULTI-SEGMENTS-QUERIES-UNION*/ UNION ');
    if (unionQueries.length > 1) {
      const includesAllowedQueriesOnly = unionQueries
        .every((unionQuery: string) => segments.filter((segment) => (segment as ManualCollectionSegment)?.query?.replace(/;\s*/i, '') === unionQuery).length > 0);

      return includesAllowedQueriesOnly;
    }

    // NOTICE: Queries made by the FRONT to browse to an SQL segment
    return segments.some((segment) => (segment as ManualCollectionSegment)?.query === segmentQuery);
  }

}
