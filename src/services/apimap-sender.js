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

  send(envSecret, apimap) {
    this.superagentRequest
      .post(`${this.forestUrl}/forest/apimaps`)
      .send(apimap)
      .set('forest-secret-key', envSecret)
      .end((_error, result) => {
        this.handleResult(result);
      });
  }
}

module.exports = ApimapSender;
