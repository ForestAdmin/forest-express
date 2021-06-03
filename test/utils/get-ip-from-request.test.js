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
      expect.assertions(1);

      expect(getIpFromRequest(request)).toStrictEqual('34.235.48.51');
    });

    describe('with a loopback in the header', () => {
      it('should return the loopback', () => {
        expect.assertions(1);

        request.headers['x-forwarded-for'] = '10.0.10.117, 127.0.0.1';

        expect(getIpFromRequest(request)).toStrictEqual('127.0.0.1');
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
      expect.assertions(1);

      expect(getIpFromRequest(request)).toStrictEqual('34.235.48.51');
    });
  });
});
