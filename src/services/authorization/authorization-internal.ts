import hashObject from 'object-hash';

import RecordsCounter from '../exposed/records-counter';

import InvalidActionConditionError from './errors/invalidActionConditionError';

export type User = {
  id: number;
  renderingId: number;
  email: string;
  tags: Record<string, string>;
};

export type GenericPlainTreeBranch = { aggregator: string; conditions: Array<GenericPlainTree> };
export type GenericPlainTreeLeaf = { field: string; operator: string; value?: unknown };
export type GenericPlainTree = GenericPlainTreeBranch | GenericPlainTreeLeaf;

export type RecordsCounterParams = {
  model: never, user: User, timezone: string, excludesScope?: boolean
};

export async function aggregateCountConditionIntersection(
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

export async function canPerformConditionalCustomAction(
  recordsCounterParams: RecordsCounterParams,
  requestFilterPlainTree: unknown,
  conditionPlainTree: unknown | null,
) {
  if (conditionPlainTree) {
    const [requestRecordsCount, matchingRecordsCount] = await Promise.all([
      aggregateCountConditionIntersection(recordsCounterParams, requestFilterPlainTree),
      aggregateCountConditionIntersection(
        recordsCounterParams,
        requestFilterPlainTree,
        conditionPlainTree,
      ),
    ]);

    // If some records don't match the condition then the user
    // is not allow to perform the conditional action
    if (matchingRecordsCount !== requestRecordsCount) {
      return false;
    }
  }

  return true;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function transformToRolesIdsGroupByConditions<T>(
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
      conditionHash: hashObject(
        condition as never,
        { respectType: false } as hashObject.NormalOption,
      ),
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
