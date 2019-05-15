const path = require('../services/path');
const ipWhitelist = require('../services/ip-whitelist');
const errorMessages = require('../utils/error-messages');
const LoginHandler = require('../services/login-handler');

module.exports = function sessions(app, opts) {
  const { authSecret, envSecret } = opts;

  function checkAuthSecret(request, response, next) {
    if (!authSecret) {
      return response.status(401)
        .send({ errors: [{ detail: errorMessages.CONFIGURATION.AUTH_SECRET_MISSING }] });
    }
    return next();
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
    twoFactorRegistration,
    projectId,
    twoFactorToken,
  }) {
    try {
      if (twoFactorRegistration && !twoFactorToken) {
        throw new Error();
      }

      await ipWhitelist.retrieve(envSecret);

      const responseData = await new LoginHandler({
        renderingId,
        envSecret,
        authData,
        useGoogleAuthentication,
        authSecret,
        twoFactorRegistration,
        projectId,
        twoFactorToken,
      }).perform();

      // NOTICE: The token is empty at first authentication step if the 2FA option is active.
      if (responseData.token) {
        // NOTICE: Set a cookie to ensure secure authentication using export feature.
        const twoWeeksInMilliseconds = 14 * 24 * 60 * 60;
        response.header('Set-Cookie', `forest_session_token=${responseData.token}; Max-Age=${twoWeeksInMilliseconds}`);
      }
      response.send(responseData);
    } catch (error) {
      formatAndSendError(response, error);
    }
  }

  function loginWithPassword(request, response) {
    const {
      email,
      password,
      renderingId,
      projectId,
      token: twoFactorToken,
    } = request.body;
    const twoFactorRegistration = !!request.body.twoFactorRegistration;

    processLogin({
      useGoogleAuthentication: false,
      renderingId,
      authData: { email, password },
      response,
      twoFactorRegistration,
      projectId,
      twoFactorToken,
    });
  }

  function loginWithGoogle(request, response) {
    const {
      forestToken,
      renderingId,
      projectId,
      token: twoFactorToken,
    } = request.body;
    const twoFactorRegistration = !!request.body.twoFactorRegistration;

    processLogin({
      useGoogleAuthentication: true,
      renderingId,
      authData: { forestToken },
      response,
      twoFactorRegistration,
      projectId,
      twoFactorToken,
    });
  }

  this.perform = () => {
    app.post(path.generate('sessions', opts), checkAuthSecret, loginWithPassword);
    app.post(path.generate('sessions-google', opts), checkAuthSecret, loginWithGoogle);
  };
};
