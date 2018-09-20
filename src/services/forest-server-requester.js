const P = require('bluebird');
const superagent = require('superagent');
const ServiceUrlGetter = require('./service-url-getter');
const errorMessages = require('../utils/error-messages');
const VError = require('verror');

function perform (route, environmentSecret, queryParameters, headers) {
  const urlService = new ServiceUrlGetter().perform();

  return new P((resolve, reject) => {
    const request = superagent
      .get(urlService + route)
      .set('forest-secret-key', environmentSecret);

    if (headers) {
      request.set(headers);
    }

    if (queryParameters) {
      request.query(queryParameters);
    }

    request.end(function (error, result) {
      if (error) {
        return reject(new VError(error, 'Forest server request error'));
      }

      if (result.status === 200 && result.body) {
        return resolve(result.body);
      } else {
        if (result.status === 0) {
          return reject(new Error(errorMessages.SERVER_TRANSACTION.SERVER_DOWN));
        } else if (result.status === 404 || result.status === 422) {
          return reject(new Error(errorMessages.SERVER_TRANSACTION.SECRET_NOT_FOUND));
        } else {
          return reject(new Error(errorMessages.SERVER_TRANSACTION.UNEXPECTED, error));
        }
      }
    });
  });
}

module.exports.perform = perform;
