const timeoutError = require('../utils/timeout-error');

class ApimapSender {
  constructor({ forestUrl, logger, superagentRequest }) {
    this.forestUrl = forestUrl;
    this.superagentRequest = superagentRequest;
    this.logger = logger;
  }

  handleResult(result) {
    if (!result) return;

    if ([200, 202, 204].includes(result.status)) {
      if (result.body && result.body.warning) {
        this.logger.warn(result.body.warning);
      }
    } else if (result.status === 0) {
      this.logger.warn('Cannot send the apimap to Forest. Are you online?');
    } else if (result.status === 404) {
      this.logger.error('Cannot find the project related to the envSecret you configured. Can you check on Forest that you copied it properly in the Forest initialization?');
    } else if (result.status === 503) {
      this.logger.warn('Forest is in maintenance for a few minutes. We are upgrading your experience in the forest. We just need a few more minutes to get it right.');
    } else {
      this.logger.error('An error occured with the apimap sent to Forest. Please contact support@forestadmin.com for further investigations.');
    }
  }

  _send(envSecret, data, path) {
    const url = `${this.forestUrl}/${path}`;
    return this.superagentRequest
      .post(url)
      .set('forest-secret-key', envSecret)
      .send(data)
      .catch((error) => {
        const message = timeoutError(url, error);
        if (message) {
          throw new Error(message);
        } else {
          throw error;
        }
      })
      .then((result) => {
        this.handleResult(result);
        return result;
      });
  }

  send(envSecret, apimap) {
    return this._send(envSecret, apimap, 'forest/apimaps');
  }

  checkHash(envSecret, schemaFileHash) {
    return this._send(envSecret, { schemaFileHash }, 'forest/apimaps/hashcheck');
  }
}

module.exports = ApimapSender;
