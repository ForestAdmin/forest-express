const AuthenticationService = require('../../src/services/authentication');

describe('authenticationService', () => {
  function setup() {
    const Issuer = jest.fn();
    const Client = jest.fn();
    const issuer = { Client };
    const client = {
      authorizationUrl: jest.fn(),
      callback: jest.fn(),
    };

    Issuer.mockReturnValue(issuer);
    Client.mockReturnValue(client);

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

    const oidcConfigurationRetrieverService = {
      retrieve: jest.fn(),
    };

    const authenticationService = new AuthenticationService({
      openIdClient: {
        Issuer,
      },
      env: {
        FOREST_URL: 'https://api.development.forestadmin.com',
      },
      authorizationFinder,
      tokenService,
      errorMessages,
      oidcConfigurationRetrieverService,
    });

    return {
      authenticationService,
      client,
      Client,
      issuer,
      Issuer,
      authorizationFinder,
      tokenService,
      errorMessages,
      oidcConfigurationRetrieverService,
    };
  }

  describe('startAuthentication', () => {
    it('should correctly generate the authorizationUrl', async () => {
      expect.assertions(4);
      const {
        client, authenticationService, Client, Issuer, oidcConfigurationRetrieverService,
      } = setup();

      const generatedUrl = 'https://production.com/forest/authorization/cb?oidc=true';
      client.authorizationUrl.mockReturnValue(generatedUrl);

      const oidcConfig = { issuer: 'forest-admin' };
      oidcConfigurationRetrieverService.retrieve.mockReturnValue(Promise.resolve(oidcConfig));

      const redirectUrl = 'https://production.com/forest/authentication/cb';
      const result = await authenticationService.startAuthentication(
        redirectUrl,
        { renderingId: 42 },
      );


      expect(Issuer).toHaveBeenCalledWith(oidcConfig);

      expect(result).toStrictEqual({ authorizationUrl: generatedUrl });
      expect(client.authorizationUrl).toHaveBeenCalledWith({
        scope: 'openid email profile',
        state: JSON.stringify({ renderingId: 42 }),
      });
      expect(Client).toHaveBeenCalledWith({
        client_id: 'forest-express-temporary-fixed-id',
        redirect_uris: [redirectUrl],
        token_endpoint_auth_method: 'none',
      });
    });
  });

  describe('verifyCodeAndGenerateToken', () => {
    it('should authenticate the user and create a token', async () => {
      expect.assertions(4);
      const {
        authorizationFinder, client, tokenService, authenticationService,
        oidcConfigurationRetrieverService,
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


      const oidcConfig = { issuer: 'forest-admin' };
      oidcConfigurationRetrieverService.retrieve.mockReturnValue(Promise.resolve(oidcConfig));

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
        null,
        null,
        null,
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
