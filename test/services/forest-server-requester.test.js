const ForestServerRequester = require('../../src/services/forest-server-requester');
const errorMessages = require('../../src/utils/error-messages');

const { addNock } = require('../helpers/request');

describe('services > forest-server-requester', () => {
  const SERVER_URL = 'http://some.url';

  describe('perform', () => {
    const forestServerRequester = new ForestServerRequester({
      forestUrl: SERVER_URL,
      errorMessages,
    });

    addNock(SERVER_URL, 'get', '/a/route')
      .reply(200, {
        body: 'this is the body',
      });

    it('should return a promise', () => {
      expect.assertions(1);

      expect(forestServerRequester.perform(
        '/a/route',
        'someEnvSecret',
        {},
        {},
      )).toBeInstanceOf(Promise);
    });

    describe('when the request end with a HTTP status 200', () => {
      addNock(SERVER_URL, 'get', '/a/route')
        .reply(200, {
          body: 'this is the body',
        });

      it('should resolve return a resolve promise with the response body', async () => {
        expect.assertions(1);

        expect(await forestServerRequester.perform(
          '/a/route',
          'someEnvSecret',
          {},
          {},
        )).toStrictEqual({ body: 'this is the body' });
      });
    });

    describe('when the request end with a HTTP status 404', () => {
      addNock(SERVER_URL, 'get', '/a/404/route')
        .reply(404, {
          body: 'this is the body',
        });

      it('should resolve return a resolve promise with the response body', async () => {
        expect.assertions(1);

        await expect(forestServerRequester.perform(
          '/a/404/route',
          'someEnvSecret',
          {},
          {},
        )).rejects.toThrow(errorMessages.SERVER_TRANSACTION.SECRET_NOT_FOUND);
      });
    });

    describe('when the request end with a HTTP status 422', () => {
      addNock(SERVER_URL, 'get', '/a/422/route')
        .reply(422, {
          body: 'this is the body',
        });

      it('should resolve return a resolve promise with the response body', async () => {
        expect.assertions(1);

        await expect(forestServerRequester.perform(
          '/a/422/route',
          'someEnvSecret',
          {},
          {},
        )).rejects.toThrow(errorMessages
          .SERVER_TRANSACTION.SECRET_AND_RENDERINGID_INCONSISTENT);
      });
    });
  });
});
