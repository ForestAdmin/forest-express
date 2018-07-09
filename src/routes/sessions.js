const path = require('../services/path');
const ipWhitelist = require('../services/ip-whitelist');
const errorMessages = require('../utils/error-messages');
const LoginHandler = require('../services/login-handler');

module.exports = function (app, opts, dependencies) {
  const { authSecret, envSecret } = opts;

  function checkAuthSecret(request, response, next) {
    if (!authSecret) {
      return response.status(401)
        .send({ errors: [{ detail: errorMessages.CONFIGURATION.AUTH_SECRET_MISSING }] });
    }
    next();
  }

  function formatAndSendError(response, error) {
    let body;
    if (error && error.message) {
      body = { errors: [{ detail: error.message }] };
    }
    return response.status(401).send(body);
  }

  async function processLogin({ useGoogleAuthentication, renderingId, authData, response }) {
    try {
      await ipWhitelist.retrieve(envSecret);

      const responseData = await new LoginHandler({
        renderingId,
        envSecret,
        authData,
        useGoogleAuthentication,
        authSecret,
        dependencies,
      }).perform();

      response.send(responseData);
    } catch(error) {
      formatAndSendError(response, error);
    }
  }

  function loginWithPassword(request, response) {
    const renderingId = request.body.renderingId;
    const { email, password } = request.body;

    processLogin({
      useGoogleAuthentication: false,
      renderingId,
      authData: { email, password },
      response,
    });
  }

  function loginWithGoogle(request, response) {
    const renderingId = request.body.renderingId;
    const forestToken = request.body.forestToken;

    processLogin({
      useGoogleAuthentication: true,
      renderingId,
      authData: { forestToken },
      response,
    });
  }

  this.perform = function () {
    app.post(path.generate('sessions', opts), checkAuthSecret, loginWithPassword);
    app.post(path.generate('sessions-google', opts), checkAuthSecret, loginWithGoogle);
  };
};
