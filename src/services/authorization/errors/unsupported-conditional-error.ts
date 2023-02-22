import UnprocessableError from '../../../utils/errors/unprocessable-error';

export default class UnsupportedConditionalsError extends UnprocessableError {
  constructor() {
    super(
      'The roles conditions (conditional smart actions) are not supported with Smart Collection. Please contact an administrator.',
    );

    this.name = 'UnsupportedConditionalsFeatureError';
  }
}
