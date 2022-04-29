const ResourceSerializer = require('../../src/serializers/resource');
const Schemas = require('../../src/generators/schemas');
const carsSchema = require('../fixtures/cars-schema.js');
const jedisSchema = require('../fixtures/jedis-schema.js');
const sithsSchema = require('../fixtures/siths-schema.js');
const padawansSchema = require('../fixtures/padawans-schema.js');

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
  Schemas.schemas = {
    cars: carsSchema, jedis: jedisSchema, siths: sithsSchema, padawans: padawansSchema,
  };

  function getSerializer(modelName, records) {
    return new ResourceSerializer(
      Implementation,
      { name: modelName },
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

    const serialized = await getSerializer('cars', records).perform();

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

  describe('with relationships', () => {
    it('should return all the links to those relationships', async () => {
      expect.assertions(1);

      const records = [{
        id: 'luke-id',
        name: 'Luke Skywalker',
        padawans: [{
          id: 'baby-yoda-id',
          name: 'Baby Yoda',
        }],
      }, {
        id: 'obiwan-id',
        name: 'Obiwan Kenobi',
        worstEnemy: {
          id: 'anakin-id',
          name: 'Anakin Skywalker',
        },
      }];

      const serialized = await getSerializer('jedis', records).perform();

      expect(serialized).toStrictEqual({
        data: [{
          id: 'luke-id',
          type: 'jedis',
          attributes: {
            id: 'luke-id',
            name: 'Luke Skywalker',
          },
          relationships: {
            padawans: {
              links: { related: '/forest/jedis/luke-id/relationships/padawans' },
            },
            worstEnemy: {
              data: null,
              links: { related: '/forest/jedis/luke-id/relationships/worstEnemy' },
            },
          },
        }, {
          id: 'obiwan-id',
          type: 'jedis',
          attributes: {
            id: 'obiwan-id',
            name: 'Obiwan Kenobi',
          },
          relationships: {
            padawans: {
              links: { related: '/forest/jedis/obiwan-id/relationships/padawans' },
            },
            worstEnemy: {
              data: {
                id: 'anakin-id',
                type: 'siths',
              },
              links: { related: '/forest/jedis/obiwan-id/relationships/worstEnemy' },
            },
          },
        }],
        included: [{
          id: 'anakin-id',
          type: 'siths',
          attributes: {
            id: 'anakin-id',
            name: 'Anakin Skywalker',
          },
        }],
      });
    });
  });
});
