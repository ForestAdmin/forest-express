import {
  ChainedSQLQueryError,
  Chart,
  CollectionActionEvent,
  EmptySQLQueryError,
  ForestAdminClient,
  NonSelectSQLQueryError,
} from '@forestadmin/forestadmin-client';
import ForbiddenError from '../utils/errors/forbidden-error';
import BadRequestError from '../utils/errors/bad-request-error';

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

  public async assertCanBrowse(user: User, collectionName: string, segmentQuery?: string) {
    const canBrowse = await this.forestAdminClient.permissionService.canOnCollection({
      userId: user.id,
      collectionName,
      event: CollectionActionEvent.Browse,
    });

    const canExecuteSegmentQuery: boolean = !segmentQuery
      || await this.forestAdminClient.permissionService.canExecuteSegmentQuery({
        userId: user.id,
        collectionName,
        renderingId: user.renderingId,
        segmentQuery,
      });

    if (!canBrowse || !canExecuteSegmentQuery) {
      throw new ForbiddenError(`User ${user.email} is not authorized to browse on collection ${collectionName}`);
    }
  }

  public async assertCanRead(user: User, collectionName: string) {
    await this.canOnCollection(user, CollectionActionEvent.Read, collectionName);
  }

  public async assertCanAdd(user: User, collectionName: string) {
    await this.canOnCollection(user, CollectionActionEvent.Add, collectionName);
  }

  public async assertCanEdit(user: User, collectionName: string) {
    await this.canOnCollection(user, CollectionActionEvent.Edit, collectionName);
  }

  public async assertCanDelete(user: User, collectionName: string) {
    await this.canOnCollection(user, CollectionActionEvent.Delete, collectionName);
  }

  public async assertCanExport(user: User, collectionName: string) {
    await this.canOnCollection(user, CollectionActionEvent.Export, collectionName);
  }

  private async canOnCollection(
    user: User,
    event: CollectionActionEvent,
    collectionName: string,
  ) {
    const { id: userId, email } = user;

    const canOnCollection = await this.forestAdminClient.permissionService.canOnCollection({
      userId,
      event,
      collectionName,
    });

    if (!canOnCollection) {
      throw new ForbiddenError(`User ${email} is not authorize to ${event} on collection ${collectionName}`);
    }
  }

  public verifySignedActionParameters<TResult>(signedToken: string): TResult {
    try {
      return this.forestAdminClient.verifySignedActionParameters<TResult>(signedToken);
    } catch (error) {
      throw new BadRequestError('Invalid signed action parameters');
    }
  }

  public async assertCanApproveCustomAction({
    user,
    collectionName,
    customActionName,
    requesterId,
  }: {
    user: User,
    collectionName: string,
    customActionName: string,
    requesterId: number,
  }): Promise<void> {
    const canApprove = await this.forestAdminClient.permissionService.canApproveCustomAction({
      collectionName,
      customActionName,
      userId: user.id,
      requesterId,
    });

    if (!canApprove) {
      throw new ForbiddenError(`User ${user.email} is not authorized to approve custom action ${customActionName} on collection ${collectionName}`);
    }
  }

  public async assertCanTriggerCustomAction({
    user,
    collectionName,
    customActionName,
  }: {
    user: User,
    collectionName: string,
    customActionName: string,
  }): Promise<void> {
    const canTrigger = await this.forestAdminClient.permissionService.canTriggerCustomAction({
      collectionName,
      customActionName,
      userId: user.id,
    });

    if (!canTrigger) {
      throw new ForbiddenError(`User ${user.email} is not authorized to trigger custom action ${customActionName} on collection ${collectionName}`);
    }
  }

  async assertCanRetrieveChart({
    user,
    chartRequest,
  }: {
    user: User,
    chartRequest: Chart
  }): Promise<void> {
    const { renderingId, id: userId } = user;

    try {
      const canRetrieveChart = await this.forestAdminClient.permissionService.canExecuteChart({
        renderingId,
        userId,
        chartRequest,
      });

      if (!canRetrieveChart) {
        throw new ForbiddenError('User is not authorized to view this chart');
      }
    } catch (error) {
      if (error instanceof EmptySQLQueryError
        || error instanceof NonSelectSQLQueryError
        || error instanceof ChainedSQLQueryError) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }
  }
}
