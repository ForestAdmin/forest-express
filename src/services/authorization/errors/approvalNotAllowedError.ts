import ForbiddenError from '../../../utils/errors/forbidden-error';

export default class ApprovalNotAllowedError extends ForbiddenError {
  data: { roleIdsAllowedToApprove: number[] };

  constructor(roleIdsAllowedToApprove: number[]) {
    super("You don't have the permission to approve this action.");

    this.data = {
      roleIdsAllowedToApprove,
    };
  }
}
