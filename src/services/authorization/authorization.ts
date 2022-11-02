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
  intersectCount,
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
  requestConditionPlainTreeForCaller: GenericPlainTree;
  requestConditionPlainTreeForAllCaller: GenericPlainTree;
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
    requestConditionPlainTreeForCaller,
    requestConditionPlainTreeForAllCaller,
    recordsCounterParams,
  }: CanPerformCustomActionParams): Promise<void> {
    const canTrigger = await this.canTriggerCustomAction(
      userId,
      customActionName,
      collectionName,
      requestConditionPlainTreeForCaller,
      recordsCounterParams,
    );

    if (!canTrigger) {
      throw new CustomActionTriggerForbiddenError();
    }

    const triggerRequiresApproval = await this.doesTriggerCustomActionRequiresApproval(
      userId,
      customActionName,
      collectionName,
      requestConditionPlainTreeForCaller,
      recordsCounterParams,
    );

    if (triggerRequiresApproval) {
      const rolesIdsAllowedToApprove = await this.getRolesIdsAllowedToApprove(
        recordsCounterParams,
        customActionName,
        collectionName,
        requestConditionPlainTreeForAllCaller,
      );

      throw new CustomActionRequiresApprovalError(rolesIdsAllowedToApprove);
    }
  }

  public async assertCanApproveCustomAction({
    user: { id: userId },
    collectionName,
    customActionName,
    recordsCounterParams,
    requestConditionPlainTreeForCaller,
    requestConditionPlainTreeForAllCaller,
    requesterId,
  }: CanPerformCustomActionParams & {
    requesterId: number,
  }): Promise<void> {
    const canApprove = await this.canApproveCustomAction(
      userId,
      customActionName,
      collectionName,
      requestConditionPlainTreeForCaller,
      recordsCounterParams,
      requesterId,
    );

    if (!canApprove) {
      const rolesIdsAllowedToApprove = await this.getRolesIdsAllowedToApprove(
        recordsCounterParams,
        customActionName,
        collectionName,
        requestConditionPlainTreeForAllCaller,
      );

      throw new ApprovalNotAllowedError(rolesIdsAllowedToApprove);
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
    requestConditionPlainTreeForCaller: GenericPlainTree,
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

    const conditionalTriggerRawCondition = await this.forestAdminClient.permissionService
      .getConditionalTriggerCondition({
        userId,
        customActionName,
        collectionName,
      });

    return canPerformConditionalCustomAction(
      recordsCounterParams,
      requestConditionPlainTreeForCaller,
      conditionalTriggerRawCondition,
    );
  }

  private async doesTriggerCustomActionRequiresApproval(
    userId: string | number,
    customActionName: string,
    collectionName: string,
    requestConditionPlainTreeForCaller: GenericPlainTree,
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

    const conditionalRequiresApprovalRawCondition = await this.forestAdminClient.permissionService
      .getConditionalRequiresApprovalCondition({
        userId,
        customActionName,
        collectionName,
      });

    if (conditionalRequiresApprovalRawCondition) {
      const matchingRecordsCount = await intersectCount(
        recordsCounterParams,
        requestConditionPlainTreeForCaller,
        conditionalRequiresApprovalRawCondition,
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
    requestConditionPlainTreeForCaller: GenericPlainTree,
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

    const conditionalApproveRawCondition = await this.forestAdminClient.permissionService
      .getConditionalApproveCondition({
        userId,
        customActionName,
        collectionName,
      });

    return canPerformConditionalCustomAction(
      recordsCounterParams,
      requestConditionPlainTreeForCaller,
      conditionalApproveRawCondition,
    );
  }

  private async getRolesIdsAllowedToApprove(
    recordsCounterParams: RecordsCounterParams,
    customActionName: string,
    collectionName: string,
    requestConditionPlainTreeForAllCaller: GenericPlainTree,
  ) {
    const actionConditionsByRoleId = await this.forestAdminClient.permissionService
      .getConditionalApproveConditions({
        customActionName,
        collectionName,
      });

    const rolesIdsGroupByConditions = transformToRolesIdsGroupByConditions(
      actionConditionsByRoleId,
    );

    const [requestRecordsCount, ...conditionRecordsCounts]: number[] = await Promise.all([
      intersectCount(recordsCounterParams, requestConditionPlainTreeForAllCaller),
      // eslint-disable-next-line max-len
      ...rolesIdsGroupByConditions.map(({ condition }) => intersectCount(recordsCounterParams, requestConditionPlainTreeForAllCaller, condition)),
    ]);

    return rolesIdsGroupByConditions.reduce<number[]>(
      (rolesIdsAllowedToApprove, { roleIds }, currentIndex) => {
        if (requestRecordsCount === conditionRecordsCounts[currentIndex]) {
          rolesIdsAllowedToApprove.push(...roleIds);
        }

        return rolesIdsAllowedToApprove;
      },
      [],
    );
  }
}
