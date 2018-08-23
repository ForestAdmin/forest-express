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

  async function processLogin({
    useGoogleAuthentication,
    renderingId,
    authData,
    response,
    isRegistration,
    projectId,
    twoFactorToken,
  }) {
    try {
      if (isRegistration && !twoFactorToken) {
        throw new Error();
      }

      await ipWhitelist.retrieve(envSecret);

      const responseData = await new LoginHandler({
        renderingId,
        envSecret,
        authData,
        useGoogleAuthentication,
        authSecret,
        isRegistration,
        projectId,
        twoFactorToken,
        dependencies,
      }).perform();

      response.send(responseData);
    } catch(error) {
      formatAndSendError(response, error);
    }
  }

  function loginWithPassword(request, response) {
    const { email, password, renderingId, projectId, token: twoFactorToken } = request.body;
    const isRegistration = !!request.body.registration;

    processLogin({
      useGoogleAuthentication: false,
      renderingId,
      authData: { email, password },
      response,
      isRegistration,
      projectId,
      twoFactorToken,
    });
  }

  function loginWithGoogle(request, response) {
    const { forestToken, renderingId, projectId, token: twoFactorToken } = request.body;
    const isRegistration = !!request.body.registration;

    processLogin({
      useGoogleAuthentication: true,
      renderingId,
      authData: { forestToken },
      response,
      isRegistration,
      projectId,
      twoFactorToken,
    });
  }

  this.perform = function () {
    app.post(path.generate('sessions', opts), checkAuthSecret, loginWithPassword);
    app.post(path.generate('sessions-google', opts), checkAuthSecret, loginWithGoogle);
  };
};
