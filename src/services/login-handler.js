const logger = require('../services/logger.js');
const jwt = require('jsonwebtoken');
const UserSecretCreator = require('./user-secret-creator');
const AuthorizationFinder = require('./authorization-finder');
const otplib = require('otplib');
const TwoFactorRegistrationConfirmer = require('../services/two-factor-registration-confirmer');

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

    if (TWO_FACTOR_SECRET_SALT === undefined) {
      logger.error('Cannot use the two factor authentication because the environment variable "FOREST_2FA_SECRET_SALT" is not set.\nYou can generate it using this command: `$ openssl rand -hex 10`');
      throw new Error('Invalid 2FA configuration, please ask more information to your admin');
    }

    if (TWO_FACTOR_SECRET_SALT.length !== 20) {
      logger.error('The FOREST_2FA_SECRET_SALT environment variable must be 20 characters long.\nYou can generate it using this command: `$ openssl rand -hex 10`');
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
    return jwt.sign({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      team: user.teams[0],
      renderingId: sessionRenderingId,
    }, authSecret, {
      expiresIn: '14 days',
    });
  }

  this.perform = async () => {
    let user;
    if (useGoogleAuthentication) {
      user = await new AuthorizationFinder(
        renderingId,
        envSecret,
        twoFactorRegistration,
        null,
        null,
        forestToken,
      ).perform();
    } else {
      user = await new AuthorizationFinder(
        renderingId,
        envSecret,
        twoFactorRegistration,
        email,
        password,
      ).perform();
    }

    if (!user) {
      throw new Error();
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
