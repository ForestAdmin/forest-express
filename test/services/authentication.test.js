const AuthenticationService = require('../../src/services/authentication');

describe('authenticationService', () => {
  function setup() {
    const client = {
      authorizationUrl: jest.fn(),
      callback: jest.fn(),
    };

    const authorizationFinder = {
      authenticate: jest.fn(),
    };

    const tokenService = {
      createToken: jest.fn(),
    };

    const errorMessages = {
      SERVER_TRANSACTION: {
        INVALID_STATE_MISSING: 'Missing state',
        INVALID_STATE_FORMAT: 'Invalid state format',
        INVALID_STATE_RENDERING_ID: 'Missing renderingId',
      },
    };

    const oidcClientManagerService = {
      getClientForCallbackUrl: jest.fn().mockReturnValue(client),
    };

    const authenticationService = new AuthenticationService({
      env: {
        FOREST_URL: 'https://api.development.forestadmin.com',
      },
      authorizationFinder,
      tokenService,
      errorMessages,
      oidcClientManagerService,
    });

    return {
      authenticationService,
      client,
      authorizationFinder,
      tokenService,
      errorMessages,
      oidcClientManagerService,
    };
  }

  describe('startAuthentication', () => {
    it('should correctly generate the authorizationUrl', async () => {
      expect.assertions(3);
      const {
        client, authenticationService, oidcClientManagerService,
      } = setup();

      const generatedUrl = 'https://production.com/forest/authorization/cb?oidc=true';
      client.authorizationUrl.mockReturnValue(generatedUrl);

      const redirectUrl = 'https://production.com/forest/authentication/cb';
      const result = await authenticationService.startAuthentication(
        redirectUrl,
        { renderingId: 42 },
      );

      expect(result).toStrictEqual({ authorizationUrl: generatedUrl });
      expect(client.authorizationUrl).toHaveBeenCalledWith({
        scope: 'openid email profile',
        state: JSON.stringify({ renderingId: 42 }),
      });
      expect(oidcClientManagerService.getClientForCallbackUrl).toHaveBeenCalledWith(redirectUrl);
    });
  });

  describe('verifyCodeAndGenerateToken', () => {
    it('should authenticate the user and create a token', async () => {
      expect.assertions(5);
      const {
        authorizationFinder, client, tokenService, authenticationService,
        oidcClientManagerService,
      } = setup();

      client.callback.mockReturnValue(Promise.resolve({
        access_token: 'THE-ACCESS-TOKEN',
      }));

      const user = {
        id: 666,
        first_name: 'Alice',
        last_name: 'Doe',
        email: 'alice@forestadmin.com',
      };

      authorizationFinder.authenticate.mockReturnValue(Promise.resolve(user));
      tokenService.createToken.mockReturnValue('THE-TOKEN');

      const options = {
        envSecret: 'THE-ENV-SECRET',
        authSecret: 'THE-AUTH-SECRET',
      };

      const result = await authenticationService.verifyCodeAndGenerateToken(
        'https://agent-url.com/forest/authentication/callback',
        {
          state: '{"renderingId": 42}',
        },
        options,
      );

      expect(result).toStrictEqual('THE-TOKEN');
      expect(oidcClientManagerService.getClientForCallbackUrl)
        .toHaveBeenCalledWith('https://agent-url.com/forest/authentication/callback');
      expect(client.callback).toHaveBeenCalledWith(
        'https://agent-url.com/forest/authentication/callback',
        {
          state: '{"renderingId": 42}',
        },
        {
          state: '{"renderingId": 42}',
        },
      );
      expect(authorizationFinder.authenticate).toHaveBeenCalledWith(
        42,
        'THE-ENV-SECRET',
        'THE-ACCESS-TOKEN',
      );
      expect(tokenService.createToken).toHaveBeenCalledWith(
        user,
        42,
        options,
      );
    });

    describe('with an invalid state', () => {
      it('should throw an error if the state is missing', async () => {
        expect.assertions(1);
        const { authenticationService } = setup();

        await expect(authenticationService.verifyCodeAndGenerateToken(
          'https://foo',
          {},
          undefined,
        )).rejects.toStrictEqual(new Error('Missing state'));
      });

      it('should throw an error if the state is not parsable', async () => {
        expect.assertions(1);
        const { authenticationService } = setup();

        await expect(authenticationService.verifyCodeAndGenerateToken(
          'https://foo',
          { state: '{' },
          undefined,
        )).rejects.toStrictEqual(new Error('Invalid state format'));
      });

      it('should throw an error if the state does not contain a renderingId', async () => {
        expect.assertions(1);
        const { authenticationService } = setup();

        await expect(authenticationService.verifyCodeAndGenerateToken(
          'https://foo',
          { state: '{}' },
          undefined,
        )).rejects.toStrictEqual(new Error('Missing renderingId'));
      });
    });
  });
});
