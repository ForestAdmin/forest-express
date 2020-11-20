const superagent = require('superagent');
const VError = require('verror');

class ForestServerRequester {
  constructor({ forestUrl, errorMessages }) {
    this.forestUrl = forestUrl;
    this.errorMessages = errorMessages;
  }

  perform(route, environmentSecret, queryParameters, headers) {
    return new Promise((resolve, reject) => {
      const request = superagent
        .get(this.forestUrl + route)
        .set('forest-secret-key', environmentSecret);

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
            return reject(new Error(this.errorMessages.SERVER_TRANSACTION.SERVER_DOWN));
          }
          if (result.status === 404) {
            return reject(new Error(this.errorMessages.SERVER_TRANSACTION.SECRET_NOT_FOUND));
          }
          if (result.status === 422) {
            return reject(new Error(this.errorMessages
              .SERVER_TRANSACTION.SECRET_AND_RENDERINGID_INCONSISTENT));
          }
        }

        if (error) {
          return reject(new VError(error, 'Forest server request error'));
        }

        return reject(new Error(this.errorMessages.SERVER_TRANSACTION.UNEXPECTED, error));
      });
    });
  }
}

module.exports = ForestServerRequester;
