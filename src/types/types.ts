// This will be exposed later
export type User = Record<string, any> & {
  id: number;
  tags: Record<string, string>;
};

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

export interface IForestAdminClient {
  canBrowse(userId: number, collectionName: string): Promise<boolean>;

  canRead(userId: number, collectionName: string): Promise<boolean>;
  canAdd(userId: number, collectionName: string): Promise<boolean>;

  canEdit(userId: number, collectionName: string): Promise<boolean>;
  canDelete(userId: number, collectionName: string): Promise<boolean>;

  canExport(userId: number, collectionName: string): Promise<boolean>;

  canExecuteCustomAction(
    userId: number,
    customActionName: string,
    collectionName: string,
  ): Promise<boolean>;

  getScope(user: User, collectionName: string) : Promise<GenericTree>;

  canRetrieveChart({
    renderingId,
    userId,
    chartRequest,
  }: {
    renderingId: number;
    userId: number;
    chartRequest: any;
  }): Promise<boolean>

  markScopesAsUpdated(renderingId: number): void;
}

export const forestAdminClient = {} as IForestAdminClient;
