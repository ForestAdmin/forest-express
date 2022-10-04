const { init, inject } = require('@forestadmin/context');

const RecordsGetter = require('../../src/services/exposed/records-getter');
const Resources = require('../../src/routes/resources');
const ResourceSerializer = require('../../src/serializers/resource');
const ResourceDeserializer = require('../../src/deserializers/resource');

jest.mock('../../src/services/exposed/records-getter.js');
jest.mock('../../src/serializers/resource');
jest.mock('../../src/deserializers/resource');

/**
 * Those tests are not super useful.
 *
 * They check that Implementation.ResourceUpdater() and Implementation.ResourcesRemover
 * are called with the proper parameters to avoid new regressions when the interface
 * between forest-express and the dependent packages changes.
 */
describe('routes > resources', () => {
  describe('.update', () => {
    it('should work when all parameters are valid', async () => {
      expect.assertions(3);

      // Mock app state
      const app = {};
      const model = { name: 'book' };
      const record = { id: 1, title: 'MyTitle' };

      // Mock configStore
      const resourceUpdaterPerform = jest.fn(() => Promise.resolve());
      const configStore = {
        Implementation: {
          getModelName: jest.fn(() => 'books'),
          ResourceUpdater: jest.fn(() => ({ perform: resourceUpdaterPerform })),
        },
      };
      init((context) => context.addInstance('configStore', configStore));

      // Mock deserializer / serializer
      ResourceDeserializer.mockImplementation(function MyResourceDeserializer() {
        this.perform = () => Promise.resolve(record);
      });
      ResourceSerializer.mockImplementation(function MyResourceSerializer() {
        this.perform = () => Promise.resolve(record);
      });

      // Mock express
      const next = jest.fn();
      const req = {
        params: { recordId: '1' },
        query: { timezone: 'Europe/Paris' },
        user: { renderingId: 1 },
      };
      const res = { }; // eslint-disable-line sonarjs/prefer-object-literal
      res.status = () => res;
      res.send = () => res;

      // Test
      const subject = new Resources(app, model, inject());
      await subject.update(req, res, next);

      expect(configStore.Implementation.getModelName)
        .toHaveBeenCalledWith(model);

      expect(configStore.Implementation.ResourceUpdater)
        .toHaveBeenCalledWith(model, { timezone: 'Europe/Paris', recordId: '1' }, record, req.user);

      expect(resourceUpdaterPerform).toHaveBeenCalledWith();
    });
  });

  describe('.delete', () => {
    it('should work when all parameters are valid', async () => {
      expect.assertions(5);

      // Mock app state
      const app = {};
      const model = { name: 'book' };

      // Mock configStore
      const resourceRemoverPerform = jest.fn();
      const configStore = {
        Implementation: {
          getModelName: jest.fn(() => 'books'),
          ResourcesRemover: jest.fn(() => ({ perform: resourceRemoverPerform })),
        },
      };
      init((context) => context.addInstance('configStore', configStore));

      // Mock RecordsGetter
      const recordsGetterGetRecords = jest
        .spyOn(RecordsGetter.prototype, 'getIdsFromRequest')
        .mockImplementation(() => [1, 2, 3]);

      // Mock express
      const next = jest.fn();
      const req = { query: { timezone: 'Europe/Paris', ids: '1,2,3' }, user: { renderingId: 1 } };
      const res = { }; // eslint-disable-line sonarjs/prefer-object-literal
      res.status = () => res;
      res.send = () => res;

      // Test
      const subject = new Resources(app, model, inject());
      await subject.removeMany(req, res, next);

      expect(RecordsGetter).toHaveBeenCalledWith(model, req.user, req.query);
      expect(recordsGetterGetRecords).toHaveBeenCalledWith(req);

      expect(configStore.Implementation.getModelName)
        .toHaveBeenCalledWith(model);

      expect(configStore.Implementation.ResourcesRemover)
        .toHaveBeenCalledWith(model, req.query, [1, 2, 3], req.user);

      expect(resourceRemoverPerform).toHaveBeenCalledWith();
    });
  });
});
