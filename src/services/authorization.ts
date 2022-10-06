import { Request } from 'express';
import { CollectionActionEvent } from '@forestadmin/forestadmin-client';
import ForestAdminClient from '../forest-admin-client/forest-admin-client';

export type User = {
  id: number;
  renderingId: number;
  email: string;
  tags: Record<string, string>;
};

export default class AuthorizationService {
  private readonly forestAdminClient: ForestAdminClient;

  constructor({
    forestAdminClient,
  }: {
      forestAdminClient: ForestAdminClient;
    }) {
    this.forestAdminClient = forestAdminClient;
  }

  public async canBrowse(user: User, collectionName: string, segmentQuery?: string) {
    if (
      !(await this.forestAdminClient.canBrowse({
        userId: user.id,
        collectionName,
        renderingId: user.renderingId,
        segmentQuery,
      }))
    ) {
      throw new Error(`Forbidden - User ${user.email} is not authorize to browse on collection ${collectionName}`);
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
      !(await this.forestAdminClient.canOnCollection({
        userId,
        event,
        collectionName,
      }))
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

    const bodyOrFalse = await this.forestAdminClient.canExecuteCustomAction({
      userId,
      customActionName,
      collectionName,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      body: request.body,
    });

    if (!bodyOrFalse) {
      throw new Error('Forbidden - User is not authorize Smart Action');
    }

    return bodyOrFalse;
  }

  async canRetrieveChart(request: Request): Promise<void> {
    const { renderingId, id: userId } = request.user as User;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { body: chartRequest } = request;

    if (
      !(await this.forestAdminClient.canRetrieveChart({
        renderingId,
        userId,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        chartRequest,
      }))
    ) {
      throw new Error('Forbidden - User is not authorize view this chart');
    }
  }
}
