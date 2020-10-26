const OidcConfigurationRetrieverService = require('../../src/services/oidc-configuration-retriever');

describe('oidcConfigurationRetrieverService', () => {
  function setup({ expiration } = {}) {
    const forestServerRequester = {
      perform: jest.fn(),
    };
    const context = {
      env: {
        FOREST_OIDC_CONFIG_EXPIRATION_IN_SECONDS: expiration,
      },
      forestServerRequester,
    };
    const oidcConfigurationRetrieverService = new OidcConfigurationRetrieverService(context);
    return { oidcConfigurationRetrieverService, forestServerRequester };
  }
  it('should retrieve the configuration from the server', async () => {
    expect.assertions(2);

    const { oidcConfigurationRetrieverService, forestServerRequester } = setup();

    const configuration = { issuer: 'forest-admin' };
    forestServerRequester.perform.mockReturnValue(Promise.resolve(configuration));

    const result = await oidcConfigurationRetrieverService.retrieve();

    expect(result).toBe(configuration);
    expect(forestServerRequester.perform).toHaveBeenCalledWith('/oidc/.well-known/openid-configuration');
  });

  describe('when called twice', () => {
    it('should not retrieve the configuration from the server if the cache is still valid', async () => {
      expect.assertions(2);

      const {
        oidcConfigurationRetrieverService,
        forestServerRequester,
      } = setup({ expiration: 1000 });

      const configuration = { issuer: 'forest-admin' };
      forestServerRequester.perform.mockReturnValue(Promise.resolve(configuration));

      await oidcConfigurationRetrieverService.retrieve();
      const result = await oidcConfigurationRetrieverService.retrieve();

      expect(result).toBe(configuration);
      expect(forestServerRequester.perform).toHaveBeenCalledTimes(1);
    });

    it('should retrieve the configuration from the server if the cache expired', async () => {
      expect.assertions(2);

      const {
        oidcConfigurationRetrieverService,
        forestServerRequester,
      } = setup({ expiration: 1 });

      const configuration = { issuer: 'forest-admin' };
      forestServerRequester.perform.mockReturnValue(Promise.resolve(configuration));

      await oidcConfigurationRetrieverService.retrieve();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const result = await oidcConfigurationRetrieverService.retrieve();

      expect(result).toBe(configuration);
      expect(forestServerRequester.perform).toHaveBeenCalledTimes(2);
    });
  });
});
