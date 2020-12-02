// eslint-disable-next-line max-classes-per-file
const _ = require('lodash');

const SmartFieldsValuesInjector = require('../../src/services/smart-fields-values-injector');
const Schemas = require('../../src/generators/schemas');
const usersSchema = require('../fixtures/users-schema.js');
const addressesSchema = require('../fixtures/addresses-schema.js');

describe('services > smart-fields-values-injector', () => {
  // Mock user sequelize object
  class UserWithMagicAccessor {
    constructor(id) {
      this.id = id;
      this.dataValues = { // specific to sequelize
        id,
      };
    }
  }
  // mock magic accessor on higher level of prototype
  UserWithMagicAccessor.prototype.hasAddress = () => false;


  // Mock address sequelize object
  class AddressWithMagicAccessor {
    constructor(id, user) {
      this.id = id;
      this.user = user;
      this.dataValues = { // specific to sequelize
        id,
        user,
      };
    }
  }
  // mock magic accessor on higher level of prototype
  AddressWithMagicAccessor.prototype.hasUser = () => false;

  let userRecord;
  let addressRecord;

  // eslint-disable-next-line jest/no-hooks
  beforeEach(() => {
    userRecord = new UserWithMagicAccessor(123);
    addressRecord = new AddressWithMagicAccessor(456, userRecord);
  });

  describe('without Smart Fields', () => {
    it('should not modify the record', async () => {
      expect.assertions(1);
      // NOTICE: Clone users fixture and remove smart field.
      const usersSchemaWithoutSmartField = _.cloneDeep(usersSchema);
      usersSchemaWithoutSmartField.fields.shift();
      Schemas.schemas = { users: usersSchemaWithoutSmartField };
      const fieldsPerModel = { users: ['id'] };
      const injector = new SmartFieldsValuesInjector(userRecord, 'users', fieldsPerModel);
      await injector.perform();
      expect(userRecord).toStrictEqual(userRecord);
    });
  });

  describe('with a simple Smart Field', () => {
    it('should inject the Smart Field value in the record', async () => {
      expect.assertions(1);
      Schemas.schemas = { users: usersSchema };
      const fieldsPerModel = { users: ['id', 'smart'] };
      const injector = new SmartFieldsValuesInjector(userRecord, 'users', fieldsPerModel);
      await injector.perform();
      expect(userRecord.smart).toStrictEqual({ foo: 'bar' });
    });
  });

  describe('with a Smart Relationship that reference a collection having a Smart Field', () => {
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
    // NOTICE: note the add of the `hasUser`/`hasAddress` function, this is for
    // mocking sequelize magic accessor

    const fieldsPerModel = { addresses: ['id', 'user', 'hasUser', 'smart_user'], user: ['smart', 'hasAddress'], smart_user: ['smart', 'hasAddress'] };

    it('should inject the Smart Relationship reference', async () => {
      expect.assertions(3);
      Schemas.schemas = { users: usersSchema, addresses: addressesSchema };
      const injector = new SmartFieldsValuesInjector(addressRecord, 'addresses', fieldsPerModel);
      await injector.perform();
      expect(addressRecord.hasUser).toBe(true);
      expect(addressRecord.user.hasAddress).toBe(true);
      expect(addressRecord.smart_user.hasAddress).toBe(true);
    });
  });
});
