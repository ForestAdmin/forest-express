import ForbiddenError from '../../../utils/errors/forbidden-error';

export default class CustomActionRequiresApprovalError extends ForbiddenError {
  data: { rolesIdsAllowedToApprove: number[] };

  constructor(rolesIdsAllowedToApprove: number[]) {
    super('This action requires to be approved.');

    this.data = {
      rolesIdsAllowedToApprove,
    };
  }
}
