// This will be exposed later
export type User = Record<string, any> & {
  id: number;
  tags: Record<string, string>;
};

export enum CollectionActionEvent {
  Browse = 'browse',
  Export = 'export',
  Read = 'read',
  Edit = 'edit',
  Delete = 'delete',
  Add = 'add',
}

export const uniqueOperators = [
  // All types besides arrays
  'Equal',
  'NotEqual',
  'LessThan',
  'GreaterThan',

  // Strings
  'Like',
  'ILike',
  'NotContains',
  'LongerThan',
  'ShorterThan',

  // Arrays
  'IncludesAll',
] as const;

export const intervalOperators = [
  // Dates
  'Today',
  'Yesterday',
  'PreviousMonth',
  'PreviousQuarter',
  'PreviousWeek',
  'PreviousYear',
  'PreviousMonthToDate',
  'PreviousQuarterToDate',
  'PreviousWeekToDate',
  'PreviousXDaysToDate',
  'PreviousXDays',
  'PreviousYearToDate',
] as const;

export const otherOperators = [
  // All types
  'Present',
  'Blank',
  'Missing',

  // All types besides arrays
  'In',
  'NotIn',

  // Strings
  'StartsWith',
  'EndsWith',
  'Contains',
  'IStartsWith',
  'IEndsWith',
  'IContains',

  // Dates
  'Before',
  'After',
  'AfterXHoursAgo',
  'BeforeXHoursAgo',
  'Future',
  'Past',
] as const;

export const allOperators = [...uniqueOperators, ...intervalOperators, ...otherOperators] as const;

export type Operator = typeof allOperators[number];
export type Aggregator = 'And' | 'Or';
// eslint-disable-next-line no-use-before-define
export type GenericTreeBranch = { aggregator: Aggregator; conditions: Array<GenericTree> };
export type GenericTreeLeaf = { field: string; operator: Operator; value?: unknown };
export type GenericTree = GenericTreeBranch | GenericTreeLeaf;

export interface SmartActionRequestBody {
  data: {
    id: string;
    type: string;
    attributes: Record<string, any> & {
      requester_id: number;
      ids: Array<string>;
      collection_name: string;
      smart_action_id: string;
      values: any | null;
      parent_collection_name: string | null;
      parent_collection_id: string | null;
      parent_association_name: string | null;
      all_records: boolean;
      all_records_subset_query: null;
    };
  };
}

export interface SmartActionApprovalRequestBody extends SmartActionRequestBody {
  data: SmartActionRequestBody['data'] & {
    attributes: SmartActionRequestBody['data']['attributes'] & {
      signed_approval_request: string;
    };
  };
}

export interface IForestAdminClient {
  renderingPermissionService: any;

  canOnCollection(
    userId: number,
    event: CollectionActionEvent,
    collectionName: string,
  ): Promise<boolean>;
  canExecuteCustomAction(params: {
    userId: number;
    customActionName: string;
    collectionName: string;
    body: SmartActionRequestBody | SmartActionApprovalRequestBody;
  }): Promise<false | SmartActionRequestBody>;

  canExecuteCustomActionHook(params: {
    userId: number;
    customActionName: string;
    collectionName: string;
  }): Promise<boolean>;

  getScope(renderingId: number, user: User, collectionName: string): Promise<GenericTree>;

  canRetrieveChart({
    renderingId,
    userId,
    chartRequest,
  }: {
    renderingId: number;
    userId: number;
    chartRequest: any;
  }): Promise<boolean>;

  markScopesAsUpdated(renderingId: number): void;
}

export const forestAdminClient = {} as IForestAdminClient;
