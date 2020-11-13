const request = require('superagent');
const context = require('../context');
const logger = require('./logger');

function ApimapSender(envSecret, apimap) {
  const { forestUrlGetter } = context.inject();

  this.perform = () => {
    const urlService = forestUrlGetter();

    request
      .post(`${urlService}/forest/apimaps`)
      .send(apimap)
      .set('forest-secret-key', envSecret)
      .end((error, result) => {
        if (result) {
          if ([200, 202, 204].indexOf(result.status) !== -1) {
            if (result.body && result.body.warning) {
              logger.warn(result.body.warning);
            }
          } else if (result.status === 0) {
            logger.warn('Cannot send the apimap to Forest. Are you online?');
          } else if (result.status === 404) {
            logger.error('Cannot find the project related to the envSecret you configured. Can you check on Forest that you copied it properly in the Forest initialization?');
          } else if (result.status === 503) {
            logger.warn('Forest is in maintenance for a few minutes. We are upgrading your experience in the forest. We just need a few more minutes to get it right.');
          } else {
            logger.error('An error occured with the apimap sent to Forest. Please contact support@forestadmin.com for further investigations.');
          }
        }
      });
  };
}

module.exports = ApimapSender;
