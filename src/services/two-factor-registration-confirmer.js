const P = require('bluebird');
const request = require('superagent');
const ServiceUrlGetter = require('./service-url-getter');
const logger = require('./logger');

function TwoFactorRegistrationConfirmer({
  projectId,
  envSecret,
  useGoogleAuthentication,
  email,
  forestToken,
}) {
  this.perform = () =>
    new P((resolve, reject) => {
      const forestUrl = new ServiceUrlGetter().perform();
      const bodyData = { useGoogleAuthentication };

      if (useGoogleAuthentication) {
        bodyData.forestToken = forestToken;
      } else {
        bodyData.email = email;
      }

      request
        .post(`${forestUrl}/liana/v2/projects/${projectId}/two-factor-registration-confirm`)
        .send(bodyData)
        .set('forest-secret-key', envSecret)
        .end((error) => {
          if (error) {
            logger.error(error);
            return reject(new Error());
          }
          return resolve();
        });
    });
}

module.exports = TwoFactorRegistrationConfirmer;
