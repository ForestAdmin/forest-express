const forestServerRequester = require('./forest-server-requester');
const logger = require('./logger');

function GoogleAuthorizationFinder(renderingId, forestToken, environmentSecret, twoFactorRegistration) {
  this.perform = function () {
    let url = `/liana/v2/renderings/${renderingId}/google-authorization`;

    if (twoFactorRegistration) {
      url += `?two-factor-registration=${twoFactorRegistration}`;
    }

<<<<<<< HEAD
    return forestServerRequester
      .perform(url, environmentSecret, null, { 'forest-token': forestToken })
      .then(result => result.data.attributes)
      .catch((error) => {
        logger.error(error);
        throw new Error();
      });
=======
      request
        .get(url)
        .set('forest-secret-key', environmentSecret)
        .set('forest-token', forestToken)
        .end(function (error, result) {
          new ServerResponseHandler(error, result)
            .perform()
            .then((data) => {
              const user = data.attributes;
              user.id = data.id;
              resolve(user);
            })
            .catch(() => {
              logger.error(error);
              reject(new Error());
            });
        });
    });
>>>>>>> [-] Authentication - Fix an empty user id attribut in the JWT tokens
  };
}

module.exports = GoogleAuthorizationFinder;
