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
    describe('with an email and password', () => {
      it('should send the credentials to the forest admin server and return the user', async () => {
        expect.assertions(2);
        const { authorizationFinder, forestServerRequester } = setup();

        forestServerRequester.perform.mockReturnValue(Promise.resolve({
          data: {
            attributes: {
              email: 'alice@forestadmin.com',
              first_name: 'Alice',
            },
            id: 666,
          },
        }));

        const result = await authorizationFinder.authenticate(
          42,
          'ABCDE',
          false,
          'alice@forestadmin.com',
          'secret',
          null,
        );

        expect(result).toStrictEqual({
          id: 666,
          email: 'alice@forestadmin.com',
          first_name: 'Alice',
        });
        expect(forestServerRequester.perform)
          .toHaveBeenCalledWith(
            '/liana/v2/renderings/42/authorization',
            'ABCDE',
            null,
            { email: 'alice@forestadmin.com', password: 'secret' },
          );
      });
    });

    describe('with a google token', () => {
      it('should send the credentials to the forest admin server and return the user', async () => {
        expect.assertions(2);
        const { authorizationFinder, forestServerRequester } = setup();

        forestServerRequester.perform.mockReturnValue(Promise.resolve({
          data: {
            attributes: {
              email: 'alice@forestadmin.com',
              first_name: 'Alice',
            },
            id: 666,
          },
        }));

        const result = await authorizationFinder.authenticate(
          42,
          'ABCDE',
          false,
          null,
          null,
          'THE-TOKEN',
        );

        expect(result).toStrictEqual({
          id: 666,
          email: 'alice@forestadmin.com',
          first_name: 'Alice',
        });
        expect(forestServerRequester.perform)
          .toHaveBeenCalledWith(
            '/liana/v2/renderings/42/authorization',
            'ABCDE',
            null,
            { 'forest-token': 'THE-TOKEN' },
          );
      });
    });

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
          'ABCDE',
          false,
          'alice@forestadmin.com',
          'secret',
          null,
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
          'ABCDE',
          false,
          'alice@forestadmin.com',
          'secret',
          null,
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
          'ABCDE',
          false,
          'alice@forestadmin.com',
          'secret',
          null,
        )).rejects.toBeInstanceOf(Error);
      });
    });
  });
});
