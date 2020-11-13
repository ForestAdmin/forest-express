const P = require('bluebird');
const request = require('superagent');
const logger = require('./logger');
const context = require('../context');

function TwoFactorRegistrationConfirmer({
  projectId,
  envSecret,
  useGoogleAuthentication,
  email,
  forestToken,
}) {
  const { forestUrlGetter } = context.inject();

  this.perform = () =>
    new P((resolve, reject) => {
      const forestUrl = forestUrlGetter();
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
            logger.error('Two factor registration confirmation error: ', error);
            return reject(new Error());
          }
          return resolve();
        });
    });
}

module.exports = TwoFactorRegistrationConfirmer;
