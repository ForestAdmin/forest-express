const otplib = require('otplib');
const logger = require('../services/logger.js');
const UserSecretCreator = require('./user-secret-creator');
const TwoFactorRegistrationConfirmer = require('../services/two-factor-registration-confirmer');
const { is2FASaltValid } = require('../utils/token-checker');
const context = require('../context/index.js');

const { authorizationFinder, tokenService } = context.inject();

function LoginHandler({
  renderingId,
  envSecret,
  authData,
  useGoogleAuthentication,
  authSecret,
  twoFactorRegistration,
  projectId,
  twoFactorToken,
}) {
  const { forestToken, email, password } = authData;

  function isTwoFactorTokenValid(user, token) {
    const twoFactorAuthenticationSecret = user.two_factor_authentication_secret;
    const userSecret = new UserSecretCreator(
      twoFactorAuthenticationSecret,
      process.env.FOREST_2FA_SECRET_SALT,
    )
      .perform();

    return otplib.authenticator.verify({ token, secret: userSecret });
  }

  function getTwoFactorResponse(user) {
    const TWO_FACTOR_SECRET_SALT = process.env.FOREST_2FA_SECRET_SALT;

    try {
      is2FASaltValid(TWO_FACTOR_SECRET_SALT);
    } catch (error) {
      logger.error(error.message);
      throw new Error('Invalid 2FA configuration, please ask more information to your admin');
    }

    if (user.two_factor_authentication_active) {
      return { twoFactorAuthenticationEnabled: true };
    }
    const twoFactorAuthenticationSecret = user.two_factor_authentication_secret;
    const userSecret = new UserSecretCreator(twoFactorAuthenticationSecret, TWO_FACTOR_SECRET_SALT)
      .perform();

    return {
      twoFactorAuthenticationEnabled: true,
      userSecret,
    };
  }

  function createToken(user, sessionRenderingId) {
    return tokenService.createToken(user, sessionRenderingId, { authSecret });
  }

  this.perform = async () => {
    let user;
    if (useGoogleAuthentication) {
      user = await authorizationFinder.authenticate(
        renderingId,
        envSecret,
        twoFactorRegistration,
        null,
        null,
        forestToken,
      );
    } else {
      user = await authorizationFinder.authenticate(
        renderingId,
        envSecret,
        twoFactorRegistration,
        email,
        password,
        null,
      );
    }

    if (user.two_factor_authentication_enabled) {
      if (twoFactorToken) {
        if (isTwoFactorTokenValid(user, twoFactorToken)) {
          await new TwoFactorRegistrationConfirmer({
            projectId,
            envSecret,
            useGoogleAuthentication,
            email,
            forestToken,
          }).perform();
          return { token: createToken(user, renderingId) };
        }
        throw new Error('Your token is invalid, please try again.');
      } else {
        return getTwoFactorResponse(user);
      }
    }

    return { token: createToken(user, renderingId) };
  };
}

module.exports = LoginHandler;
