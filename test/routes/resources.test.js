const ApplicationContext = require('../../src/context/application-context');
const Resources = require('../../src/routes/resources');
const RecordsGetter = require('../../src/services/exposed/records-getter.js');

jest.mock('../../src/services/exposed/records-getter.js');

describe('routes > resources', () => {
  it('should delete', async () => {
    expect.assertions(3);

    // Mock configStore
    const resourceRemoverPerform = jest.fn();
    const configStore = {
      Implementation: {
        getModelName: jest.fn(() => 'books'),
        ResourcesRemover: jest.fn(() => ({ perform: resourceRemoverPerform })),
      },
    };
    const context = new ApplicationContext();
    context.init((ctx) => ctx.addInstance('configStore', configStore));

    // Mock RecordsGetter
    jest
      .spyOn(RecordsGetter.prototype, 'getIdsFromRequest')
      .mockImplementation(() => [1, 2, 3]);

    // Mock express
    const req = { query: { timezone: 'Europe/Paris', ids: '1,2,3' }, user: {} };
    const res = { }; // eslint-disable-line sonarjs/prefer-object-literal
    res.status = () => res;
    res.send = () => res;

    const next = jest.fn();

    // Mock app state
    const app = {};
    const model = {};

    // Test
    const subject = new Resources(app, model, context.inject());
    await subject.removeMany(req, res, next);

    expect(configStore.Implementation.getModelName)
      .toHaveBeenCalledWith(model);

    expect(configStore.Implementation.ResourcesRemover)
      .toHaveBeenCalledWith(model, req.query, [1, 2, 3], req.user);

    expect(resourceRemoverPerform).toHaveBeenCalledWith();
  });
});
