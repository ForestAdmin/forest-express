const getIpFromRequest = require('../../src/utils/get-ip-from-request');

describe('utils > getIpFromRequest', () => {
  describe('with x-forwarded-for header', () => {
    const request = {
      headers: {
        'x-forwarded-for': '34.235.48.51, 10.0.10.117',
      },
      connection: {
        remoteAddress: 'should not be used',
      },
    };

    it('should return the first public ip', () => {
      expect(getIpFromRequest(request)).toBe('34.235.48.51');
    });

    it('should not fail with the port in the ip', () => {
      request.headers['x-forwarded-for'] = '10.0.10.117, 34.235.48.51:53465';

      expect(getIpFromRequest(request)).toBe('34.235.48.51');
    });

    it('should fallback to remote address if the IP in the header is invalid', () => {
      request.headers['x-forwarded-for'] = '10';
      request.connection.remoteAddress = '1.2.3.4';

      expect(getIpFromRequest(request)).toBe('1.2.3.4');
    });

    describe('with a loopback in the header', () => {
      it('should return the loopback', () => {
        request.headers['x-forwarded-for'] = '10.0.10.117, 127.0.0.1';

        expect(getIpFromRequest(request)).toBe('127.0.0.1');
      });
    });
  });

  describe('without x-forwarded-for header', () => {
    const request = {
      headers: {},
      connection: {
        remoteAddress: '34.235.48.51',
      },
    };

    it('should return the remoteAddress ip', () => {
      expect(getIpFromRequest(request)).toBe('34.235.48.51');
    });
  });
});
