import {
  ForestAdminClient,
} from '@forestadmin/forestadmin-client';
import hashObject from 'object-hash';
import BadRequestError from '../../utils/errors/bad-request-error';
import RecordsCounter from '../exposed/records-counter';

import ApprovalNotAllowedError from './errors/approvalNotAllowedError';
import CustomActionRequiresApprovalError from './errors/customActionRequiresApprovalError';
import CustomActionTriggerForbiddenError from './errors/customActionTriggerForbiddenError';
import InvalidActionConditionError from './errors/invalidActionConditionError';
import type { GenericPlainTree, User } from './types';

type RecordsCounterParams = {
  model: never, user: User, timezone: string, excludesScope?: boolean
};

type CanPerformCustomActionParams = {
  user: User;
  customActionName: string;
  collectionName: string;
  filterForCaller: GenericPlainTree;
  recordsCounterParams: RecordsCounterParams;
};

export default class ActionAuthorizationService {
  private readonly forestAdminClient: ForestAdminClient;

  constructor({
    forestAdminClient,
  }: {
    forestAdminClient: ForestAdminClient;
  }) {
    this.forestAdminClient = forestAdminClient;
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
    filterForCaller,
    recordsCounterParams,
  }: CanPerformCustomActionParams): Promise<void> {
    const canTrigger = await this.canTriggerCustomAction(
      userId,
      customActionName,
      collectionName,
      filterForCaller,
      recordsCounterParams,
    );

    if (!canTrigger) {
      throw new CustomActionTriggerForbiddenError();
    }

    const triggerRequiresApproval = await this.doesTriggerCustomActionRequiresApproval(
      userId,
      customActionName,
      collectionName,
      filterForCaller,
      recordsCounterParams,
    );

    if (triggerRequiresApproval) {
      const roleIdsAllowedToApprove = await this.getRoleIdsAllowedToApprove(
        recordsCounterParams,
        customActionName,
        collectionName,
        filterForCaller,
      );

      throw new CustomActionRequiresApprovalError(roleIdsAllowedToApprove);
    }
  }

  public async assertCanApproveCustomAction({
    user: { id: userId },
    collectionName,
    customActionName,
    recordsCounterParams,
    filterForCaller,
    requesterId,
  }: CanPerformCustomActionParams & {
    requesterId: number,
  }): Promise<void> {
    const canApprove = await this.canApproveCustomAction(
      userId,
      customActionName,
      collectionName,
      filterForCaller,
      recordsCounterParams,
      requesterId,
    );

    if (!canApprove) {
      const roleIdsAllowedToApprove = await this.getRoleIdsAllowedToApprove(
        recordsCounterParams,
        customActionName,
        collectionName,
        filterForCaller,
      );

      throw new ApprovalNotAllowedError(roleIdsAllowedToApprove);
    }
  }

  private async canTriggerCustomAction(
    userId: string | number,
    customActionName: string,
    collectionName: string,
    filterForCaller: GenericPlainTree,
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

    return ActionAuthorizationService.canPerformConditionalCustomAction(
      recordsCounterParams,
      filterForCaller,
      triggerConditionPlainTree,
    );
  }

  private async doesTriggerCustomActionRequiresApproval(
    userId: string | number,
    customActionName: string,
    collectionName: string,
    filterForCaller: GenericPlainTree,
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
      const matchingRecordsCount = await ActionAuthorizationService
        .aggregateCountConditionIntersection(
          recordsCounterParams,
          filterForCaller,
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
    filterForCaller: GenericPlainTree,
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

    return ActionAuthorizationService.canPerformConditionalCustomAction(
      recordsCounterParams,
      filterForCaller,
      approveConditionPlainTree,
    );
  }

  private async getRoleIdsAllowedToApprove(
    recordsCounterParams: RecordsCounterParams,
    customActionName: string,
    collectionName: string,
    filterForCaller: GenericPlainTree,
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
    const rolesIdsGroupByConditions = ActionAuthorizationService
      .transformToRolesIdsGroupByConditions(
        actionConditionsByRoleId,
      );

    if (!rolesIdsGroupByConditions.length) {
      return roleIdsAllowedToApproveWithoutConditions;
    }

    const [requestRecordsCount, ...conditionRecordsCounts] = await Promise.all([
      ActionAuthorizationService.aggregateCountConditionIntersection({
        ...recordsCounterParams,
        excludesScope: true,
      }, filterForCaller),
      // eslint-disable-next-line max-len
      ...rolesIdsGroupByConditions.map(({ condition: conditionPlainTree }) => ActionAuthorizationService.aggregateCountConditionIntersection({
        ...recordsCounterParams,
        excludesScope: true,
      }, filterForCaller, conditionPlainTree)),
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

  private static async canPerformConditionalCustomAction(
    recordsCounterParams: RecordsCounterParams,
    requestFilterPlainTree: unknown,
    conditionPlainTree: unknown | null,
  ) {
    if (conditionPlainTree) {
      const [requestRecordsCount, matchingRecordsCount] = await Promise.all([
        ActionAuthorizationService
          .aggregateCountConditionIntersection(recordsCounterParams, requestFilterPlainTree),
        ActionAuthorizationService
          .aggregateCountConditionIntersection(
            recordsCounterParams,
            requestFilterPlainTree,
            conditionPlainTree,
          ),
      ]);

      // If all records condition the condition everything is ok
      // Otherwise when some records don't match the condition then the user
      // is not allow to perform the conditional action
      return matchingRecordsCount === requestRecordsCount;
    }

    return true;
  }

  private static async aggregateCountConditionIntersection(
    recordsCounterParams: RecordsCounterParams,
    requestFilterPlainTree: unknown,
    conditionPlainTree?: unknown,
  ): Promise<number> {
    try {
    // Perform intersection when conditionPlainTree is defined
      const rawFilter = conditionPlainTree
        ? {
          aggregator: 'and',
          conditions: [requestFilterPlainTree, conditionPlainTree],
        }
        : requestFilterPlainTree;

      // Build filter with the right format
      const conditionalFilterFormatted = JSON.stringify(rawFilter);

      const recordsCounter = new RecordsCounter(
        recordsCounterParams.model,
        recordsCounterParams.user,
        { filters: conditionalFilterFormatted, timezone: recordsCounterParams.timezone },
      );

      // Support aggregate count without user scope (used by getRoleIdsAllowedToApprove)
      recordsCounter.excludesScope = recordsCounterParams.excludesScope ?? false;

      return await recordsCounter.count();
    } catch (error) {
      throw new InvalidActionConditionError();
    }
  }

  /**
   * Given a map it groups keys based on their hash values
   */
  private static transformToRolesIdsGroupByConditions<T>(
    actionConditionsByRoleId?: Map<number, T>,
  ): {
      roleIds: number[];
      condition: T;
    }[] {
    if (!actionConditionsByRoleId) {
      return [];
    }

    const rolesIdsGroupByConditions = Array.from(
      actionConditionsByRoleId,
      ([roleId, condition]) => ({
        roleId,
        condition,
        conditionHash: hashObject(condition as never, { respectType: false }),
      }),
    ).reduce((acc, current) => {
      const { roleId, condition, conditionHash } = current;

      if (acc.has(conditionHash)) {
        // We don't need nullish operator but our TS config might be wrong since it's required
        acc.get(conditionHash)?.roleIds.push(roleId);
      } else {
        acc.set(conditionHash, { roleIds: [roleId], condition });
      }

      return acc;
    }, new Map<string, { roleIds: number[]; condition: T }>());

    return Array.from(rolesIdsGroupByConditions.values());
  }
}
