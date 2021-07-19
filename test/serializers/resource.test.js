const ResourceSerializer = require('../../src/serializers/resource');
const Schemas = require('../../src/generators/schemas');
const carsSchema = require('../fixtures/cars-schema.js');

const Implementation = {
  getModelName: (model) => model.name,
  getLianaName: jest.fn().mockReturnValue('forest-express-mongoose'),
  getOrmVersion: jest.fn(),
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

  it('should correctly serialize with flattened fields', async () => {
    expect.assertions(1);
    const records = [
      {
        _id: '5fbfb0ee67e7953f9b8414bf',
        name: 'Zoey',
        engine: {
          identification: { manufacturer: 'Renault' },
          horsePower: '125cv',
        },
        __v: 0,
      }, {
        _id: '5f928f4f1eedcfbce937bbd0',
        name: 'Ibiza',
      }];

    const serialized = await getSerializer(records).perform();

    expect(serialized).toStrictEqual({
      data: [{
        attributes: {
          _id: '5fbfb0ee67e7953f9b8414bf',
          engine: {
            identification: {
              manufacturer: 'Renault',
            },
          },
          'engine|horsePower': '125cv',
          name: 'Zoey',
        },
        type: 'cars',
      }, {
        attributes: {
          _id: '5f928f4f1eedcfbce937bbd0',
          'engine|horsePower': null,
          name: 'Ibiza',
        },
        type: 'cars',
      }],
    });
  });
});
