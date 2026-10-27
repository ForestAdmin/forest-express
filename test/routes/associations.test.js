const { init } = require('@forestadmin/context');
const Associations = require('../../src/routes/associations');
const Schemas = require('../../src/generators/schemas');
const auth = require('../../src/services/auth');
const { default: ForbiddenError } = require('../../src/utils/errors/forbidden-error');

jest.mock('../../src/serializers/resource');

const ResourceSerializer = require('../../src/serializers/resource');

const user = { id: 1, renderingId: 2, email: 'user@forestadmin.com' };
const segmentQuery = 'select id from cars';

const buildRequest = ({ query = {}, body } = {}) => ({
  route: { path: '/forest/owners/:recordId/relationships/cars' },
  params: { recordId: '42' },
  query,
  body,
  user,
});

function executeMiddleware(middleware, request) {
  return new Promise((resolve) => {
    middleware(request, {}, (error) => resolve(error));
  });
}

function setupAssociations({ canExecuteSegmentQuery = true } = {}) {
  Schemas.schemas = {
    owners: {
      name: 'owners',
      fields: [{ field: 'cars', type: ['Number'], reference: 'cars.id' }],
    },
    cars: { name: 'cars', primaryKeys: ['id'] },
  };

  const assertCanExecuteSegmentQuery = jest.fn(() => (canExecuteSegmentQuery
    ? Promise.resolve()
    : Promise.reject(new ForbiddenError())));

  const carsModel = { name: 'cars' };
  const ownersModel = { name: 'owners' };

  const Implementation = {
    getModelName: jest.fn((model) => model.name),
    HasManyGetter: jest.fn(() => ({ perform: () => Promise.resolve([[], null]) })),
    HasManyDissociator: jest.fn(() => ({ perform: () => Promise.resolve() })),
  };

  const app = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  init((context) => context
    .addInstance('modelsManager', { getModels: () => [carsModel] })
    .addInstance('authorizationService', { assertCanExecuteSegmentQuery })
    .addInstance('actionAuthorizationService', {})
    .addInstance('logger', { warn: jest.fn(), error: jest.fn() }));

  ResourceSerializer.mockImplementation(function Serializer() {
    this.perform = () => Promise.resolve([]);
  });

  jest.spyOn(auth, 'ensureAuthenticated').mockImplementation((request, response, next) => next());

  new Associations(app, ownersModel, Implementation, {}, {}).perform();

  return { app, assertCanExecuteSegmentQuery, Implementation };
}

describe('routes > associations', () => {
  describe('has-many related routes', () => {
    it('registers the segment query middleware on the csv, list, count and delete routes', () => {
      expect.assertions(12);

      const { app } = setupAssociations();

      expect(app.get).toHaveBeenCalledTimes(3);
      expect(app.get.mock.calls[0]).toHaveLength(4);
      expect(typeof app.get.mock.calls[0][2]).toBe('function');
      expect(app.get.mock.calls[1]).toHaveLength(4);
      expect(typeof app.get.mock.calls[1][2]).toBe('function');
      expect(app.get.mock.calls[2]).toHaveLength(4);
      expect(typeof app.get.mock.calls[2][2]).toBe('function');
      expect(app.post.mock.calls[0]).toHaveLength(3);
      expect(app.put.mock.calls[0]).toHaveLength(3);
      expect(app.delete).toHaveBeenCalledTimes(1);
      expect(app.delete.mock.calls[0]).toHaveLength(4);
      expect(typeof app.delete.mock.calls[0][2]).toBe('function');
    });

    it('checks the segment query permission of the related collection on the list route', async () => {
      expect.assertions(2);

      const { app, assertCanExecuteSegmentQuery } = setupAssociations();
      const segmentQueryMiddleware = app.get.mock.calls[1][2];

      const error = await executeMiddleware(
        segmentQueryMiddleware,
        buildRequest({ query: { segmentQuery } }),
      );

      expect(error).toBeUndefined();
      expect(assertCanExecuteSegmentQuery).toHaveBeenCalledOnceWith(user, 'cars', segmentQuery);
    });

    it('refuses the list route with a 403 before the getter is built', async () => {
      expect.assertions(3);

      const { app, Implementation } = setupAssociations({ canExecuteSegmentQuery: false });
      const segmentQueryMiddleware = app.get.mock.calls[1][2];

      const error = await executeMiddleware(
        segmentQueryMiddleware,
        buildRequest({ query: { segmentQuery } }),
      );

      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.status).toBe(403);
      expect(Implementation.HasManyGetter).not.toHaveBeenCalled();
    });

    it('checks the segment query permission of the related collection on the count route', async () => {
      expect.assertions(2);

      const { app, assertCanExecuteSegmentQuery } = setupAssociations();
      const segmentQueryMiddleware = app.get.mock.calls[2][2];

      const error = await executeMiddleware(
        segmentQueryMiddleware,
        buildRequest({ query: { segmentQuery } }),
      );

      expect(error).toBeUndefined();
      expect(assertCanExecuteSegmentQuery).toHaveBeenCalledOnceWith(user, 'cars', segmentQuery);
    });

    it('refuses the csv export route with a 403 when the segment is not allowed', async () => {
      expect.assertions(2);

      const { app, assertCanExecuteSegmentQuery } = setupAssociations(
        { canExecuteSegmentQuery: false },
      );
      const segmentQueryMiddleware = app.get.mock.calls[0][2];

      const error = await executeMiddleware(
        segmentQueryMiddleware,
        buildRequest({ query: { segmentQuery } }),
      );

      expect(error).toBeInstanceOf(ForbiddenError);
      expect(assertCanExecuteSegmentQuery).toHaveBeenCalledOnceWith(user, 'cars', segmentQuery);
    });

    it('checks the segment query permission of the related collection on the dissociate route', async () => {
      expect.assertions(2);

      const { app, assertCanExecuteSegmentQuery } = setupAssociations();
      const segmentQueryMiddleware = app.delete.mock.calls[0][2];

      const error = await executeMiddleware(
        segmentQueryMiddleware,
        buildRequest({
          body: {
            data: {
              attributes: {
                all_records: true,
                all_records_subset_query: { segmentQuery },
              },
            },
          },
        }),
      );

      expect(error).toBeUndefined();
      expect(assertCanExecuteSegmentQuery).toHaveBeenCalledOnceWith(user, 'cars', segmentQuery);
    });

    it('refuses the dissociate route with a 403 before the dissociator is built', async () => {
      expect.assertions(3);

      const { app, Implementation } = setupAssociations({ canExecuteSegmentQuery: false });
      const segmentQueryMiddleware = app.delete.mock.calls[0][2];

      const error = await executeMiddleware(
        segmentQueryMiddleware,
        buildRequest({
          body: {
            data: {
              attributes: {
                all_records: true,
                all_records_subset_query: { segmentQuery },
              },
            },
          },
        }),
      );

      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.status).toBe(403);
      expect(Implementation.HasManyDissociator).not.toHaveBeenCalled();
    });

    it('reaches the list handler when the segment is allowed', async () => {
      expect.assertions(2);

      const { app, Implementation } = setupAssociations();
      const [, authMiddleware, segmentQueryMiddleware, listHandler] = app.get.mock.calls[1];
      const request = buildRequest({ query: { segmentQuery } });
      const response = { send: jest.fn() };

      await new Promise((resolve) => { authMiddleware(request, response, resolve); });
      await new Promise((resolve) => { segmentQueryMiddleware(request, response, resolve); });
      await listHandler(request, response, jest.fn());

      expect(Implementation.HasManyGetter).toHaveBeenCalledOnce();
      expect(response.send).toHaveBeenCalledTimes(1);
    });
  });
});
