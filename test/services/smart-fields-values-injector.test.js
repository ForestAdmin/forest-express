const _ = require('lodash');
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
      const record = { dataValues: { id: 123 } };
      const fieldsPerModel = { users: ['id'] };
      const injector = new SmartFieldsValuesInjector(record, 'users', fieldsPerModel);
      await injector.perform();
      expect(record).toStrictEqual({ dataValues: { id: 123 } });
    });
  });

  describe('with a simple Smart Field', () => {
    it('should inject the Smart Field value in the record', async () => {
      expect.assertions(1);
      Schemas.schemas = { users: usersSchema };
      const record = { dataValues: { id: 123 } };
      const fieldsPerModel = { users: ['id', 'smart'] };
      const injector = new SmartFieldsValuesInjector(record, 'users', fieldsPerModel);
      await injector.perform();
      expect(record).toStrictEqual({ dataValues: { id: 123 }, smart: { foo: 'bar' } });
    });
  });

  describe('with a Smart Relationship that reference a collection having a Smart Field', () => {
    const userRecord = { dataValues: { id: 123 } };
    const addressRecord = { dataValues: { id: 456, user: userRecord }, user: userRecord };
    const fieldsPerModel = { user: ['smart'], addresses: ['id', 'user', 'smart_user'], smart_user: ['smart'] };
    it('should inject the Smart Relationship reference', async () => {
      expect.assertions(3);
      Schemas.schemas = { users: usersSchema, addresses: addressesSchema };
      const injector = new SmartFieldsValuesInjector(addressRecord, 'addresses', fieldsPerModel);
      await injector.perform();
      expect(addressRecord.smart_user).not.toBeUndefined();
      expect(addressRecord.smart_user.smart).toStrictEqual({ foo: 'bar' });
      expect(addressRecord.user.smart).toStrictEqual({ foo: 'bar' });
    });
  });

  describe('with a Smart Relationship that reference a collection having a Smart Field whose name is a magic accessor', () => {
    const userRecord = { dataValues: { id: 123 } };

    // NOTICE: note the add of the `hasUser` function, this is for mocking sequelize magic accessor
    const addressRecord = {
      dataValues: { id: 456, user: userRecord },
      user: userRecord,
      hasUser: () => false,
    };
    const fieldsPerModel = { addresses: ['id', 'user', 'hasUser'] };
    it('should inject the Smart Relationship reference', async () => {
      expect.assertions(1);
      Schemas.schemas = { users: usersSchema, addresses: addressesSchema };
      const injector = new SmartFieldsValuesInjector(addressRecord, 'addresses', fieldsPerModel);
      await injector.perform();
      expect(addressRecord.hasUser).toBe(true);
    });
  });
});
