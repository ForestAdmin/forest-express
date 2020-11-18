const OidcClientManagerService = require('../../src/services/oidc-client-manager');

describe('service > OidcClientManager', () => {
  function setupTest() {
    const issuer = {
      Client: {
        register: jest.fn(),
      },
    };
    const openIdClient = {
      Issuer: jest.fn().mockReturnValue(issuer),
    };
    const oidcConfigurationRetrieverService = {
      retrieve: jest.fn(),
    };
    const env = {
      FOREST_ENV_SECRET: 'the-secret',
    };

    const oidcClientManager = new OidcClientManagerService({
      openIdClient,
      oidcConfigurationRetrieverService,
      env,
    });

    return {
      openIdClient,
      oidcConfigurationRetrieverService,
      oidcClientManager,
      issuer,
      env,
    };
  }
  describe('getClientForCallbackUrl', () => {
    it('should register a new client on the issuer', async () => {
      expect.assertions(4);

      const {
        oidcClientManager, openIdClient, oidcConfigurationRetrieverService, issuer,
      } = setupTest();

      const configuration = { issuer: 'forest admin' };
      const newClient = { client_id: 'the-id' };
      oidcConfigurationRetrieverService.retrieve.mockReturnValue(configuration);
      issuer.Client.register.mockReturnValue(Promise.resolve(newClient));

      const result = await oidcClientManager.getClientForCallbackUrl('https://here.local');

      expect(result).toBe(newClient);
      expect(oidcConfigurationRetrieverService.retrieve).toHaveBeenCalledWith();
      expect(openIdClient.Issuer).toHaveBeenCalledWith(configuration);
      expect(issuer.Client.register).toHaveBeenCalledWith({
        token_endpoint_auth_method: 'none',
        redirect_uris: ['https://here.local'],
      }, {
        initialAccessToken: 'the-secret',
      });
    });

    it('should reuse the same promise for the same callback url', async () => {
      expect.assertions(2);

      const {
        oidcClientManager, oidcConfigurationRetrieverService, issuer,
      } = setupTest();

      const configuration = { issuer: 'forest admin' };
      const newClient = { client_id: 'the-id' };
      oidcConfigurationRetrieverService.retrieve.mockReturnValue(configuration);
      issuer.Client.register.mockReturnValue(Promise.resolve(newClient));

      const result1 = await oidcClientManager.getClientForCallbackUrl('https://here.local');
      const result2 = await oidcClientManager.getClientForCallbackUrl('https://here.local');

      expect(result1).toBe(result2);
      expect(issuer.Client.register).toHaveBeenCalledTimes(1);
    });

    it('should not cache an error, and allow to try a second registration', async () => {
      expect.assertions(2);

      const {
        oidcClientManager, oidcConfigurationRetrieverService, issuer,
      } = setupTest();

      const configuration = { issuer: 'forest admin' };
      const newClient = { client_id: 'the-id' };
      oidcConfigurationRetrieverService.retrieve.mockReturnValue(configuration);
      const error = new Error();
      issuer.Client.register
        .mockReturnValueOnce(Promise.reject(error))
        .mockReturnValueOnce(Promise.resolve(newClient));

      await expect(oidcClientManager.getClientForCallbackUrl('https://here.local'))
        .rejects.toStrictEqual(error);

      await oidcClientManager.getClientForCallbackUrl('https://here.local');

      expect(issuer.Client.register).toHaveBeenCalledTimes(2);
    });
  });
});
