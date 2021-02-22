const AuthorizationFinder = require('../../src/services/authorization-finder');
const InconsistentSecretAndRenderingError = require('../../src/utils/errors/authentication/inconsistent-secret-rendering-error');
const SecretNotFoundError = require('../../src/utils/errors/authentication/secret-not-found-error');
const TwoFactorAuthenticationRequiredError = require('../../src/utils/errors/authentication/two-factor-authentication-required-error');

describe('authorization-finder', () => {
  function setup() {
    const forestServerRequester = {
      perform: jest.fn(),
    };

    /** @type {*} */
    const logger = {
      error: jest.fn(),
    };

    /** @type {*} */
    const errorMessages = {
      SERVER_TRANSACTION: {
        SECRET_AND_RENDERINGID_INCONSISTENT: 'inconsistent rendering id',
        SECRET_NOT_FOUND: 'secret not found',
        names: {
          TWO_FACTOR_AUTHENTICATION_REQUIRED: 'TwoFactorAuthenticationRequiredForbiddenError',
        },
      },
    };

    /** @type {*} */
    const context = {
      forestServerRequester,
      logger,
      errorMessages,
    };

    const authorizationFinder = new AuthorizationFinder(context);

    return {
      authorizationFinder, forestServerRequester, logger, errorMessages,
    };
  }

  describe('authenticate', () => {
    describe('when the server returns an error', () => {
      it('should return a InconsistentSecretAndRenderingError if the server returned this error', async () => {
        expect.assertions(1);
        const { authorizationFinder, forestServerRequester } = setup();

        forestServerRequester.perform.mockRejectedValue({
          message: 'inconsistent rendering id',
        });

        await expect(authorizationFinder.authenticate(
          42,
          'ABCDE',
          false,
          'alice@forestadmin.com',
          'secret',
          null,
        )).rejects.toBeInstanceOf(InconsistentSecretAndRenderingError);
      });

      it('should return a SecretNotFoundError if the server returned this error', async () => {
        expect.assertions(1);
        const { authorizationFinder, forestServerRequester } = setup();

        forestServerRequester.perform.mockRejectedValue({
          message: 'secret not found',
        });

        await expect(authorizationFinder.authenticate(
          42,
          'secret',
          'TOKEN',
        )).rejects.toBeInstanceOf(SecretNotFoundError);
      });

      it('should return a TwoFactorAuthenticationRequiredError if the server returned this kind of error', async () => {
        expect.assertions(1);
        const { authorizationFinder, forestServerRequester } = setup();

        forestServerRequester.perform.mockRejectedValue({
          jse_cause: {
            response: {
              body: {
                errors: [{
                  name: 'TwoFactorAuthenticationRequiredForbiddenError',
                }],
              },
            },
          },
        });

        await expect(authorizationFinder.authenticate(
          42,
          'secret',
          'TOKEN',
        )).rejects.toBeInstanceOf(TwoFactorAuthenticationRequiredError);
      });

      it('should return an empty error if the server returned an unknown error', async () => {
        expect.assertions(1);
        const { authorizationFinder, forestServerRequester } = setup();

        forestServerRequester.perform.mockRejectedValue({
          message: 'unknown',
        });

        await expect(authorizationFinder.authenticate(
          42,
          'secret',
          'TOKEN',
        )).rejects.toBeInstanceOf(Error);
      });
    });
  });
});
