export type User = {
  id: number;
  renderingId: number;
  email: string;
  tags: Record<string, string>;
};

export type GenericPlainTreeBranch = { aggregator: string; conditions: Array<GenericPlainTree> };
export type GenericPlainTreeLeaf = { field: string; operator: string; value?: unknown };
export type GenericPlainTree = GenericPlainTreeBranch | GenericPlainTreeLeaf;
