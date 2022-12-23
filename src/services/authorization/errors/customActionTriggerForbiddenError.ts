import ForbiddenError from '../../../utils/errors/forbidden-error';

export default class CustomActionTriggerForbiddenError extends ForbiddenError {
  constructor() {
    super("You don't have permission to trigger this action.");
  }
}
