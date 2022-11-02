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

export type RecordsCounterParams = { model: never, user: User, timezone: string };

export async function intersectCount(
  recordsCounterParams: RecordsCounterParams,
  requestConditionPlainTree: unknown,
  conditionalRawCondition?: unknown,
): Promise<number> {
  try {
    // Perform intersection when conditionalRawCondition is defined
    const rawFilter = conditionalRawCondition
      ? {
        aggregator: 'and',
        conditions: [requestConditionPlainTree, conditionalRawCondition],
      }
      : requestConditionPlainTree;

    // Build filter with the right format
    const conditionalFilterFormatted = JSON.stringify(rawFilter);

    const recordsCounter = new RecordsCounter(
      recordsCounterParams.model,
      recordsCounterParams.user,
      { filters: conditionalFilterFormatted, timezone: recordsCounterParams.timezone },
    );

    return await recordsCounter.count();
  } catch (error) {
    throw new InvalidActionConditionError();
  }
}

export async function canPerformConditionalCustomAction(
  recordsCounterParams: RecordsCounterParams,
  requestConditionPlainTree: unknown,
  conditionalRawCondition: unknown | null,
) {
  if (conditionalRawCondition) {
    const [requestRecordsCount, matchingRecordsCount] = await Promise.all([
      intersectCount(recordsCounterParams, requestConditionPlainTree),
      intersectCount(recordsCounterParams, requestConditionPlainTree, conditionalRawCondition),
    ]);

    // If some records don't match the condition then the user
    // is not allow to perform the conditional action
    if (matchingRecordsCount !== requestRecordsCount) {
      return false;
    }
  }

  return true;
}

export function transformToRolesIdsGroupByConditions(
  actionConditionsByRoleId: Map<number, GenericPlainTree>,
): {
    roleIds: number[];
    condition: GenericPlainTree;
  }[] {
  const rolesIdsGroupByConditions = Array.from(
    actionConditionsByRoleId,
    ([roleId, conditionGenericTree]) => ({
      roleId,
      conditionGenericTree,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      conditionGenericTreeHash: hashObject(conditionGenericTree, { respectType: false }),
    }),
  ).reduce((acc, current) => {
    const { roleId, conditionGenericTree, conditionGenericTreeHash } = current;

    if (acc.has(conditionGenericTreeHash)) {
      // I don't need nullish operator but our TS config might be wrong since it's required
      acc.get(conditionGenericTreeHash)?.roleIds.push(roleId);
    } else {
      acc.set(conditionGenericTreeHash, { roleIds: [roleId], condition: conditionGenericTree });
    }

    return acc;
  }, new Map<string, { roleIds: number[]; condition: GenericPlainTree }>());

  return Array.from(rolesIdsGroupByConditions.values());
}
