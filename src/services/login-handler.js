const logger = require('../services/logger.js');
const jwt = require('jsonwebtoken');
const UserSecretCreator = require('./user-secret-creator');
const AuthorizationFinder = require('./authorization-finder');
let GoogleAuthorizationFinder = require('../services/google-authorization-finder');

function LoginHandler({
  renderingId,
  envSecret,
  authData,
  useGoogleAuthentication,
  authSecret,
  dependencies
}) {
  if (dependencies.GoogleAuthorizationFinder) {
    GoogleAuthorizationFinder = dependencies.GoogleAuthorizationFinder;
  }

  const { forestToken, email, password } = authData;

  function getTwoFactorResponse(user) {
    const twoFactorSecretSalt = process.env.FOREST_2FA_SECRET_SALT;

    if (twoFactorSecretSalt === undefined) {
      logger.error('Cannot use the two factor authentication because the environment variable "FOREST_2FA_SECRET_SALT" is not set.');
      throw new Error();
    }

    if (twoFactorSecretSalt.length !== 20) {
      logger.error('The environment variable "FOREST_2FA_SECRET_SALT" must be 20 characters long.');
      logger.error('You can generate it using this command: `$ openssl rand -hex 10`');
      throw new Error();
    }

    if (user.two_factor_authentication_active) {
      return { twoFactorAuthenticationEnabled: true };
    } else {
      const twoFactorAuthenticationSecret = user.two_factor_authentication_secret;
      const userSecret = new UserSecretCreator(twoFactorAuthenticationSecret, twoFactorSecretSalt)
        .perform();

      return {
        twoFactorAuthenticationEnabled: true,
        userSecret,
      };
    }
  }

  function createToken(user, renderingId) {
    return jwt.sign({
      id: user.id,
      type: 'users',
      data: {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        teams: user.teams
      },
      relationships: {
        renderings: {
          data: [{
            type: 'renderings',
            id: renderingId
          }]
        }
      }
    }, authSecret, {
      expiresIn: '14 days'
    });
  }

  this.perform = async () => {
    const user = useGoogleAuthentication
      ? await new GoogleAuthorizationFinder(renderingId, forestToken, envSecret).perform()
      : await new AuthorizationFinder(renderingId, email, password, envSecret).perform();

    if (!user) {
      throw new Error();
    }

    if (user.two_factor_authentication_enabled) {
      return getTwoFactorResponse(user);
    }

    return { token: createToken(user, renderingId) };
  };
}

module.exports = LoginHandler;
