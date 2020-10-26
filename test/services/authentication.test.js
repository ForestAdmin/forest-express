const AuthenticationService = require('../../src/services/authentication');

describe('authenticationService', () => {
  function setup() {
    const Issuer = jest.fn();
    const Client = jest.fn();
    const issuer = { Client };
    const client = {
      authorizationUrl: jest.fn(),
    };

    Issuer.mockReturnValue(issuer);
    Client.mockReturnValue(client);

    const authenticationService = new AuthenticationService({
      openIdClient: {
        Issuer,
      },
      env: {
        FOREST_URL: 'https://api.development.forestadmin.com',
      },
    });

    return {
      authenticationService, client, Client, issuer, Issuer,
    };
  }

  describe('constructor', () => {
    it('should create an issuer with the correct values', () => {
      expect.assertions(1);

      const { Issuer } = setup();

      expect(Issuer).toHaveBeenCalledWith({
        authorization_endpoint: 'https://api.development.forestadmin.com/oidc/authorization',
        end_session_endpoint: 'https://api.development.forestadmin.com/oidc/logout',
        issuer: 'forestadmin-server',
        token_endpoint: 'https://api.development.forestadmin.com/oidc/token',
      });
    });
  });

  describe('startAuthentication', () => {
    it('should correctly generate the authorizationUrl', () => {
      expect.assertions(3);
      const { client, authenticationService, Client } = setup();

      const generatedUrl = 'https://production.com/forest/authorization/cb?oidc=true';
      client.authorizationUrl.mockReturnValue(generatedUrl);

      const redirectUrl = 'https://production.com/forest/authentication/cb';
      const result = authenticationService.startAuthentication(redirectUrl);

      expect(result).toStrictEqual({ authorizationUrl: generatedUrl });
      expect(client.authorizationUrl).toHaveBeenCalledWith({
        scope: 'openid email profile',
      });
      expect(Client).toHaveBeenCalledWith({
        client_id: 'forest-express-temporary-fixed-id',
        redirect_uris: [redirectUrl],
      });
    });
  });
});
