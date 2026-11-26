const RecordCreator = require('../../../src/services/exposed/record-creator');
const RecordGetter = require('../../../src/services/exposed/record-getter');
const RecordUpdater = require('../../../src/services/exposed/record-updater');
const RecordsGetter = require('../../../src/services/exposed/records-getter');

describe('services › exposed › related records', () => {
  const asStored = { redactRelatedRecords: false };

  function setup() {
    const options = {};
    const record = (name, result) => function Service(...args) {
      options[name] = args[args.length - 1];
      return { perform: async () => result };
    };
    const configStore = {
      Implementation: {
        ResourceGetter: record('get', {}),
        ResourcesGetter: record('list', [[], []]),
        ResourceCreator: record('create', {}),
        ResourceUpdater: record('update', {}),
      },
      lianaOptions: {},
    };
    const deps = { configStore, modelsManager: {} };
    const args = [{ name: 'cards' }, { id: 1 }, { timezone: 'UTC' }, deps];
    return { options, args };
  }

  it('reads related records as stored in the services customer code calls', async () => {
    const { options, args } = setup();

    await new RecordGetter(...args).get(1);
    await new RecordsGetter(...args).getAll();
    await new RecordCreator(...args).create({});
    await new RecordUpdater(...args).update({}, 1);

    expect(options).toStrictEqual({
      get: asStored, list: asStored, create: asStored, update: asStored,
    });
  });
});
