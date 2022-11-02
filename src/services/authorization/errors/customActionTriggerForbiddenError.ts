import ForbiddenError from '../../../utils/errors/forbidden-error';

export default class CustomActionTriggerForbiddenError extends ForbiddenError {
  constructor() {
    super("You don't have the permission to trigger this action");
  }
}
