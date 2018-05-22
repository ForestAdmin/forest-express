const P = require('bluebird');
const request = require('superagent');
const ServiceUrlGetter = require('./service-url-getter');
const errorMessages = require('../utils/error-messages');
const httpError = require('http-errors');
const logger = require('../services/logger');

function ForestServerRequester() {
  this.perform = (environmentSecret, route) => {
    const urlService = new ServiceUrlGetter().perform();

    return new P((resolve, reject) => {
      if (route && route.length && route[0] !== '/') {
        logger.error('The route must start by "/"');
        return reject(httpError(422));
      }

      request
        .get(urlService + route)
        .set('forest-secret-key', environmentSecret)
        .end(function (error, result) {
          if (error) {
            return reject(error);
          }

          if (result.status === 200 && result.body) {
            return resolve(result.body);
          } else {
            if (result.status === 0) {
              return reject(errorMessages.SERVER_TRANSACTION.SERVER_DOWN);
            } else if (result.status === 404 || result.status === 422) {
              return reject(errorMessages.SERVER_TRANSACTION.SECRET_NOT_FOUND);
            } else {
              return reject(errorMessages.SERVER_TRANSACTION.UNEXPECTED, error);
            }
          }
        });
    });

  };
}

module.exports = ForestServerRequester;
