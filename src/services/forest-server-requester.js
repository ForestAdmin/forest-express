const { inject } = require('@forestadmin/context');
const P = require('bluebird');
const superagent = require('superagent');
const VError = require('verror');
const timeoutError = require('../utils/timeout-error');
const errorMessages = require('../utils/error-messages');

function perform(route, environmentSecret, queryParameters, headers) {
  const { forestUrl } = inject();

  // eslint-disable-next-line sonarjs/cognitive-complexity
  return new P((resolve, reject) => {
    const url = forestUrl + route;
    const request = superagent
      .get(url);

    if (environmentSecret) {
      request.set('forest-secret-key', environmentSecret);
    }

    if (headers) {
      request.set(headers);
    }

    if (queryParameters) {
      request.query(queryParameters);
    }

    request.end((error, result) => {
      if (result) {
        if (result.status === 200 && result.body) {
          return resolve(result.body);
        }
        if (result.status === 0) {
          return reject(new Error(errorMessages.SERVER_TRANSACTION.SERVER_DOWN));
        }
        if (result.status === 404) {
          return reject(new Error(errorMessages.SERVER_TRANSACTION.SECRET_NOT_FOUND));
        }
        if (result.status === 422) {
          return reject(new Error(errorMessages
            .SERVER_TRANSACTION.SECRET_AND_RENDERINGID_INCONSISTENT));
        }
      }

      if (error) {
        const message = timeoutError(url, error) || 'Forest server request error';
        return reject(new VError(error, message));
      }

      return reject(new Error(errorMessages.SERVER_TRANSACTION.UNEXPECTED, error));
    });
  });
}

module.exports = {
  perform,
};
