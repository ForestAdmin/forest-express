const forestServerRequester = require('./forest-server-requester');
const logger = require('./logger');

function AuthorizationFinder(
  renderingId,
  environmentSecret,
  twoFactorRegistration,
  email,
  password,
  forestToken,
) {
  this.perform = () => {
    let pathEnd;
    let headers;

    if (email && password) {
      pathEnd = 'authorization';
      headers = { email, password };
    } else if (forestToken) {
      pathEnd = 'google-authorization';
      headers = { 'forest-token': forestToken };
    }

    let url = `/liana/v2/renderings/${renderingId}/${pathEnd}`;

    if (twoFactorRegistration) {
      url += `?two-factor-registration=${twoFactorRegistration}`;
    }

    return forestServerRequester
      .perform(url, environmentSecret, null, headers)
      .then((result) => {
        const user = result.data.attributes;
        user.id = result.data.id;
        return user;
      })
      .catch((error) => {
        logger.error(error);
        throw new Error();
      });
  };
}

module.exports = AuthorizationFinder;
