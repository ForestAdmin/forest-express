const ResourceSerializer = require('../../src/serializers/resource');
const Schemas = require('../../src/generators/schemas');
const carsSchema = require('../fixtures/cars-schema.js');

const FLATTEN_SEPARATOR = '@@@';

const Implementation = {
  getModelName: (model) => model.name,
  getLianaName: jest.fn().mockReturnValue('forest-express-mongoose'),
  getOrmVersion: jest.fn(),
  Flattener: {
    _isFieldFlattened: jest.fn((fieldName) => fieldName.includes(FLATTEN_SEPARATOR)),
    splitOnSeparator: jest.fn((fieldName) => fieldName.split(FLATTEN_SEPARATOR)),
  },
};

describe('serializers > resource', () => {
  Schemas.schemas = { cars: carsSchema };

  function getSerializer(records) {
    return new ResourceSerializer(
      Implementation,
      { name: 'cars' },
      records,
    );
  }

  it('should serialize the flattened fields', async () => {
    expect.assertions(1);
    const records = [
      {
        _id: '5fbfb0ee67e7953f9b8414bf',
        name: 'Zoey',
        engine: {
          identification: { manufacturer: 'Renault' },
          horsePower: '125cv',
        },
      }, {
        _id: '5f928f4f1eedcfbce937bbd0',
        name: 'Ibiza',
      }];

    const serialized = await getSerializer(records).perform();

    expect(serialized).toStrictEqual({
      data: [{
        attributes: {
          _id: '5fbfb0ee67e7953f9b8414bf',
          [`engine${FLATTEN_SEPARATOR}horsePower`]: '125cv',
          [`engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}manufacturer`]: 'Renault',
          name: 'Zoey',
        },
        type: 'cars',
      }, {
        attributes: {
          _id: '5f928f4f1eedcfbce937bbd0',
          [`engine${FLATTEN_SEPARATOR}horsePower`]: null,
          [`engine${FLATTEN_SEPARATOR}identification${FLATTEN_SEPARATOR}manufacturer`]: null,
          name: 'Ibiza',
        },
        type: 'cars',
      }],
    });
  });
});
