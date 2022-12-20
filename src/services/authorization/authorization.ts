import {
  ChainedSQLQueryError,
  Chart,
  CollectionActionEvent,
  EmptySQLQueryError,
  ForestAdminClient,
  NonSelectSQLQueryError,
} from '@forestadmin/forestadmin-client';
import ForbiddenError from '../../utils/errors/forbidden-error';
import BadRequestError from '../../utils/errors/bad-request-error';
import CustomActionTriggerForbiddenError from './errors/customActionTriggerForbiddenError';
import {
  canPerformConditionalCustomAction,
  GenericPlainTree,
  aggregateCountConditionIntersection,
  RecordsCounterParams,
  transformToRolesIdsGroupByConditions,
  User,
} from './authorization-internal';
import ApprovalNotAllowedError from './errors/approvalNotAllowedError';
import CustomActionRequiresApprovalError from './errors/customActionRequiresApprovalError';

type CanPerformCustomActionParams = {
  user: User;
  customActionName: string;
  collectionName: string;
  requestFilterPlainTree: GenericPlainTree;
  recordsCounterParams: RecordsCounterParams;
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

  public async assertCanTriggerCustomAction({
    user: { id: userId },
    collectionName,
    customActionName,
    requestFilterPlainTree,
    recordsCounterParams,
  }: CanPerformCustomActionParams): Promise<void> {
    const canTrigger = await this.canTriggerCustomAction(
      userId,
      customActionName,
      collectionName,
      requestFilterPlainTree,
      recordsCounterParams,
    );

    if (!canTrigger) {
      throw new CustomActionTriggerForbiddenError();
    }

    const triggerRequiresApproval = await this.doesTriggerCustomActionRequiresApproval(
      userId,
      customActionName,
      collectionName,
      requestFilterPlainTree,
      recordsCounterParams,
    );

    if (triggerRequiresApproval) {
      const roleIdsAllowedToApprove = await this.getRoleIdsAllowedToApprove(
        recordsCounterParams,
        customActionName,
        collectionName,
        requestFilterPlainTree,
      );

      throw new CustomActionRequiresApprovalError(roleIdsAllowedToApprove);
    }
  }

  public async assertCanApproveCustomAction({
    user: { id: userId },
    collectionName,
    customActionName,
    recordsCounterParams,
    requestFilterPlainTree,
    requesterId,
  }: CanPerformCustomActionParams & {
    requesterId: number,
  }): Promise<void> {
    const canApprove = await this.canApproveCustomAction(
      userId,
      customActionName,
      collectionName,
      requestFilterPlainTree,
      recordsCounterParams,
      requesterId,
    );

    if (!canApprove) {
      const roleIdsAllowedToApprove = await this.getRoleIdsAllowedToApprove(
        recordsCounterParams,
        customActionName,
        collectionName,
        requestFilterPlainTree,
      );

      throw new ApprovalNotAllowedError(roleIdsAllowedToApprove);
    }
  }

  public async assertCanRetrieveChart({
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

  private async canTriggerCustomAction(
    userId: string | number,
    customActionName: string,
    collectionName: string,
    requestFilterPlainTree: GenericPlainTree,
    recordsCounterParams: RecordsCounterParams,
  ): Promise<boolean> {
    const canTrigger = await this.forestAdminClient.permissionService.canTriggerCustomAction({
      userId,
      customActionName,
      collectionName,
    });

    if (!canTrigger) {
      return false;
    }

    const triggerConditionPlainTree = await this.forestAdminClient.permissionService
      .getConditionalTriggerCondition({
        userId,
        customActionName,
        collectionName,
      });

    return canPerformConditionalCustomAction(
      recordsCounterParams,
      requestFilterPlainTree,
      triggerConditionPlainTree,
    );
  }

  private async doesTriggerCustomActionRequiresApproval(
    userId: string | number,
    customActionName: string,
    collectionName: string,
    requestFilterPlainTree: GenericPlainTree,
    recordsCounterParams: RecordsCounterParams,
  ): Promise<boolean> {
    const doesTriggerRequiresApproval = await this.forestAdminClient.permissionService
      .doesTriggerCustomActionRequiresApproval({
        userId,
        customActionName,
        collectionName,
      });

    if (!doesTriggerRequiresApproval) {
      return false;
    }

    const requiresConditionApprovalPlainTree = await this.forestAdminClient.permissionService
      .getConditionalRequiresApprovalCondition({
        userId,
        customActionName,
        collectionName,
      });

    if (requiresConditionApprovalPlainTree) {
      const matchingRecordsCount = await aggregateCountConditionIntersection(
        recordsCounterParams,
        requestFilterPlainTree,
        requiresConditionApprovalPlainTree,
      );

      // No records match the condition, trigger does not require approval
      if (matchingRecordsCount === 0) {
        return false;
      }
    }

    return true;
  }

  private async canApproveCustomAction(
    userId: string | number,
    customActionName: string,
    collectionName: string,
    requestFilterPlainTree: GenericPlainTree,
    recordsCounterParams: RecordsCounterParams,
    requesterId: number | string,
  ): Promise<boolean> {
    const canApprove = await this.forestAdminClient.permissionService.canApproveCustomAction({
      userId,
      customActionName,
      collectionName,
      requesterId,
    });

    if (!canApprove) {
      return false;
    }

    const approveConditionPlainTree = await this.forestAdminClient.permissionService
      .getConditionalApproveCondition({
        userId,
        customActionName,
        collectionName,
      });

    return canPerformConditionalCustomAction(
      recordsCounterParams,
      requestFilterPlainTree,
      approveConditionPlainTree,
    );
  }

  private async getRoleIdsAllowedToApprove(
    recordsCounterParams: RecordsCounterParams,
    customActionName: string,
    collectionName: string,
    requestFilterPlainTree: GenericPlainTree,
  ) {
    const actionConditionsByRoleId = await this.forestAdminClient.permissionService
      .getConditionalApproveConditions({
        customActionName,
        collectionName,
      });

    const roleIdsAllowedToApproveWithoutConditions = await this.forestAdminClient.permissionService
      .getRoleIdsAllowedToApproveWithoutConditions({
        customActionName,
        collectionName,
      });

    // Optimization - We groupBy conditions to only make the aggregate count once when possible
    const rolesIdsGroupByConditions = transformToRolesIdsGroupByConditions(
      actionConditionsByRoleId,
    );

    if (!rolesIdsGroupByConditions.length) {
      return roleIdsAllowedToApproveWithoutConditions;
    }

    const [requestRecordsCount, ...conditionRecordsCounts] = await Promise.all([
      aggregateCountConditionIntersection({
        ...recordsCounterParams,
        excludesScope: true,
      }, requestFilterPlainTree),
      // eslint-disable-next-line max-len
      ...rolesIdsGroupByConditions.map(({ condition: conditionPlainTree }) => aggregateCountConditionIntersection({
        ...recordsCounterParams,
        excludesScope: true,
      }, requestFilterPlainTree, conditionPlainTree)),
    ]);

    return rolesIdsGroupByConditions.reduce<number[]>(
      (roleIdsAllowedToApprove, { roleIds }, currentIndex) => {
        if (requestRecordsCount === conditionRecordsCounts[currentIndex]) {
          roleIdsAllowedToApprove.push(...roleIds);
        }

        return roleIdsAllowedToApprove;
      },
      // Roles  with userApprovalEnabled excluding the one with conditions
      // are allowed to approve by default
      roleIdsAllowedToApproveWithoutConditions,
    );
  }
}
