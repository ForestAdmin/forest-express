import ForbiddenError from '../../../utils/errors/forbidden-error';

export default class CustomActionRequiresApprovalError extends ForbiddenError {
  data: { roleIdsAllowedToApprove: number[]; recordIds?: Array<string | number> };

  // `recordIds` is only set for a "select all" trigger: the frontend has no explicit id list in
  // that case, so the resolved (capped) ids are handed back to be stored in the approval request.
  constructor(roleIdsAllowedToApprove: number[], recordIds?: Array<string | number>) {
    super('This action requires to be approved.');

    this.name = 'CustomActionRequiresApprovalError';
    this.data = {
      roleIdsAllowedToApprove,
      ...(recordIds ? { recordIds } : {}),
    };
  }
}
