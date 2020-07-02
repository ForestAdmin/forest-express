const _ = require('lodash');
const SequelizeMock = require('sequelize-mock');

const SmartFieldsValuesInjector = require('../../src/services/smart-fields-values-injector');
const Schemas = require('../../src/generators/schemas');
const usersSchema = require('../fixtures/users-schema.js');
const addressesSchema = require('../fixtures/addresses-schema.js');


describe('services > smart-fields-values-injector', () => {
  describe('without Smart Fields', () => {
    it('should not modify the record', async () => {
      expect.assertions(1);
      // NOTICE: Clone users fixture and remove smart field.
      const usersSchemaWithoutSmartField = _.cloneDeep(usersSchema);
      usersSchemaWithoutSmartField.fields.shift();
      Schemas.schemas = { users: usersSchemaWithoutSmartField };
      const record = { id: 123 };
      const fieldsPerModel = { users: ['id'] };
      const injector = new SmartFieldsValuesInjector(record, 'users', fieldsPerModel);
      await injector.perform();
      expect(record).toStrictEqual({ id: 123 });
    });
  });

  describe('with a simple Smart Field', () => {
    it('should inject the Smart Field value in the record', async () => {
      expect.assertions(3);

      Schemas.schemas = { users: usersSchema };
      const DBConnectionMock = new SequelizeMock();
      const UserMock = DBConnectionMock.define('users', { id: 123 }, { timestamps: false });
      const record = await UserMock.findOne({ where: { id: 123 } });
      const fieldsPerModel = { users: ['id', 'smart'] };
      const injector = new SmartFieldsValuesInjector(record, 'users', fieldsPerModel);
      await injector.perform();
      expect(record).not.toBeUndefined();
      expect(record.id).toStrictEqual(123);
      expect(record.smartValues).toStrictEqual({ smart: { foo: 'bar' } });
    });
  });

  describe('with a Smart Relationship that reference a collection having a Smart Field', () => {
    const DBConnectionMock = new SequelizeMock();
    const UserMock = DBConnectionMock.define('users', { id: 456 }, { timestamps: false });
    const fieldsPerModel = { users: ['smart'], addresses: ['id', 'user'] };
    it('should inject the Smart Relationship reference', async () => {
      expect.assertions(1);
      Schemas.schemas = { users: usersSchema, addresses: addressesSchema };
      const record = await UserMock.findOne({ where: { id: 456 } });
      const injector = new SmartFieldsValuesInjector(record, 'addresses', fieldsPerModel);
      await injector.perform();
      expect(record.smartValues.user).not.toBeUndefined();
    });
    it('should inject the Smart Field of the record referenced by the Smart Relationship', async () => {
      expect.assertions(1);
      Schemas.schemas = { users: usersSchema, addresses: addressesSchema };
      const record = await UserMock.findOne({ where: { id: 456 } });
      const injector = new SmartFieldsValuesInjector(record, 'addresses', fieldsPerModel);
      await injector.perform();
      expect(record.smartValues.user.smartValues).toStrictEqual({ smart: { foo: 'bar' } });
    });
  });
});
