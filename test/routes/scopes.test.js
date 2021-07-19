const request = require('supertest');
const context = require('../../src/context');
const createServer = require('../helpers/create-server');
const auth = require('../../src/services/auth');

const envSecret = Array(65).join('0');
const authSecret = Array(65).join('1');

describe('routes > scopes', () => {
  describe('#POST /forest/scope-cache-invalidation', () => {
    describe('when missing renderingId', () => {
      it('should return a 400', async () => {
        expect.assertions(2);

        jest.spyOn(auth, 'ensureAuthenticated').mockImplementation(
          (req, res, next) => next(),
        );

        const app = await createServer(envSecret, authSecret);
        const spyOnInvalidateScopeCache = jest.spyOn(context.inject().scopeManager, 'invalidateScopeCache');
        await new Promise((done) => {
          request(app)
            .post('/forest/scope-cache-invalidation')
            .end((error, response) => {
              expect(response.status).toStrictEqual(400);
              expect(spyOnInvalidateScopeCache).not.toHaveBeenCalled();
              done();
            });
        });

        jest.clearAllMocks();
      });
    });

    describe('when providing a valid renderingId', () => {
      it('should return a 200', async () => {
        expect.assertions(3);

        jest.spyOn(auth, 'ensureAuthenticated').mockImplementation(
          (req, res, next) => next(),
        );

        const app = await createServer(envSecret, authSecret);
        const spyOnInvalidateScopeCache = jest.spyOn(context.inject().scopeManager, 'invalidateScopeCache');
        const renderingId = 34;
        await new Promise((done) => {
          request(app)
            .post('/forest/scope-cache-invalidation')
            .send({ renderingId })
            .end((error, response) => {
              expect(response.status).toStrictEqual(200);
              expect(spyOnInvalidateScopeCache).toHaveBeenCalledTimes(1);
              expect(spyOnInvalidateScopeCache).toHaveBeenCalledWith(renderingId);
              done();
            });
        });

        jest.clearAllMocks();
      });
    });
  });
});
