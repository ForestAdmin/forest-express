import { Request } from 'express';
import { IForestAdminClient, User, CollectionActionEvent, SmartActionRequestBody } from '../types/types';

// TODO NEEDS INJECTION with addUsingClass
export default class AuthorizationService {

  private readonly forestAdminClient: IForestAdminClient;

  constructor({
      forestAdminClient
    }: {
      forestAdminClient: IForestAdminClient;
    }) {
      this.forestAdminClient = forestAdminClient;
  }

  public async canBrowse(user: User, collectionName: string, segmentQuery?: string) {
    await this.canOnCollection(user, CollectionActionEvent.Browse, collectionName);

    const { segments } = this.forestAdminClient.renderingPermissionService.permissionsByRendering.fetch(`${user.renderingId}`)?.collections?.[collectionName];

    if (segmentQuery) {
      // NOTICE: The segmentQuery should be in the segments
      if (!segments) {
        throw new Error(`Forbidden - Unable to find segment query for collection ${collectionName}`);
      }

      // NOTICE: Handle UNION queries made by the FRONT to display available actions on details view
      const unionQueries = segmentQuery.split('/*MULTI-SEGMENTS-QUERIES-UNION*/ UNION ');
      if (unionQueries.length > 1) {
        const includesAllowedQueriesOnly = unionQueries
          .every((unionQuery) => segments.filter(({ query }: { query: string}) => query?.replace(/;\s*/i, '') === unionQuery).length > 0);

        if (!includesAllowedQueriesOnly) {
        throw new Error(`Forbidden - ${user} try a suspicious segment query`);
        }

      } else if (!segments.includes(segmentQuery)) {
        throw new Error(`Forbidden - ${user} try a suspicious segment query`);
      }
    }
  }

  public async canRead(user: User, collectionName: string) {
    await this.canOnCollection(user, CollectionActionEvent.Read, collectionName);
  }

  public async canAdd(user: User, collectionName: string) {
    await this.canOnCollection(user, CollectionActionEvent.Add, collectionName);
  }

  public async canEdit(user: User, collectionName: string) {
    await this.canOnCollection(user, CollectionActionEvent.Edit, collectionName);
  }

  public async canDelete(user: User, collectionName: string) {
    await this.canOnCollection(user, CollectionActionEvent.Delete, collectionName);
  }

  public async canExport(user: User, collectionName: string) {
    await this.canOnCollection(user, CollectionActionEvent.Export, collectionName);
  }

  private async canOnCollection(
    user: User,
    event: CollectionActionEvent,
    collectionName: string,
  ) {
    const { id: userId, email } = user;

    if (
      !(await this.forestAdminClient.canOnCollection(
        userId,
        event,
        collectionName
      ))
    ) {
      throw new Error(`Forbidden - User ${email} is not authorize to ${event} on collection ${collectionName}`);
    }
  }

  public async canExecuteCustomActionAndReturnRequestBody(
    request: Request,
    customActionName: string,
    collectionName: string,
  ) {
    const { id: userId } = request.user as User;

    const bodyOrFalse =await this.forestAdminClient.canExecuteCustomAction({
      userId,
      customActionName,
      collectionName,
      body: request.body,
    });

    if (!bodyOrFalse) {
      throw new Error('Forbidden - User is not authorize Smart Action');
    }

    return bodyOrFalse as SmartActionRequestBody;
  }

  async canRetrieveChart(request: Request): Promise<void> {
    const { renderingId, id: userId } = request.user as User;
    const { body: chartRequest } = request;

    if (
      !(await this.forestAdminClient.canRetrieveChart({
        renderingId,
        userId,
        chartRequest,
      }))
    ) {
      throw new Error('Forbidden - User is not authorize view this chart');
    }
  }
}
