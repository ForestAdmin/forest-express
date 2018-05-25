const P = require('bluebird');
const request = require('superagent');
const ServiceUrlGetter = require('./service-url-getter');
const errorMessages = require('../utils/error-messages');
const VError = require('verror');

function ForestServerRequester() {
  this.perform = (route, environmentSecret) => {
    const urlService = new ServiceUrlGetter().perform();

    return new P((resolve, reject) => {
      request
        .get(urlService + route)
        .set('forest-secret-key', environmentSecret)
        .end(function (error, result) {
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

  };
}

module.exports = ForestServerRequester;
