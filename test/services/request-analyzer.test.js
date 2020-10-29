const RequestAnalyzerService = require('../../src/services/request-analyser');

describe('requestAnalyzerService', () => {
  describe('extractOriginalUrlWithoutQuery', () => {
    it('should return the correct url when the request is direct', () => {
      expect.assertions(1);
      const service = new RequestAnalyzerService();

      /** @type {*} */
      const request = {
        headers: {
          host: 'localhost.com:3342',
        },
        protocol: 'http',
        hostname: 'localhost.com',
        originalUrl: '/forest/authentication?foo=bar&hello=world',
      };

      const result = service.extractOriginalUrlWithoutQuery(request);

      expect(result).toStrictEqual('http://localhost.com:3342/forest/authentication');
    });

    it('should not include a port number if not specified', () => {
      expect.assertions(1);
      const service = new RequestAnalyzerService();

      /** @type {*} */
      const request = {
        headers: {
          host: 'localhost.com',
        },
        protocol: 'http',
        hostname: 'localhost.com',
        originalUrl: '/forest/authentication?foo=bar&hello=world',
      };

      const result = service.extractOriginalUrlWithoutQuery(request);

      expect(result).toStrictEqual('http://localhost.com/forest/authentication');
    });

    it('should correctly extract the URL when forwarded', () => {
      expect.assertions(1);
      const service = new RequestAnalyzerService();

      /** @type {*} */
      const request = {
        headers: {
          host: 'localhost.com',
          'x-forwarded-proto': 'https',
          'x-forwarded-host': 'production.com',
          'x-forwarded-port': '443',
        },
        protocol: 'http',
        hostname: 'localhost.com',
        originalUrl: '/forest/authentication?foo=bar&hello=world',
      };

      const result = service.extractOriginalUrlWithoutQuery(request);

      expect(result).toStrictEqual('https://production.com:443/forest/authentication');
    });

    it('should not use the host port when forwarded', () => {
      expect.assertions(1);
      const service = new RequestAnalyzerService();

      /** @type {*} */
      const request = {
        headers: {
          host: 'localhost.com:8080',
          'x-forwarded-proto': 'https',
          'x-forwarded-host': 'production.com',
        },
        protocol: 'http',
        hostname: 'localhost.com',
        originalUrl: '/forest/authentication?foo=bar&hello=world',
      };

      const result = service.extractOriginalUrlWithoutQuery(request);

      expect(result).toStrictEqual('https://production.com/forest/authentication');
    });
  });
});
