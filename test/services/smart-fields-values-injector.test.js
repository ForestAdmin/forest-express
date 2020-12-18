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
    }
  }
  // mock magic accessor on higher level of prototype
  UserWithMagicAccessor.prototype.hasAddress = () => false;


  // Mock address sequelize object
  class AddressWithMagicAccessor {
    constructor(id, user, islands) {
      this.id = id;
      this.user = user;
      this.islands = islands;
    }
  }
  // mock magic accessor on higher level of prototype
  AddressWithMagicAccessor.prototype.hasUser = () => false;

  const setup = () => {
    const userRecord = new UserWithMagicAccessor(123);
    const addressRecord = new AddressWithMagicAccessor(456, userRecord, ['HonoLulu', 'Tahiti']);
    return {
      userRecord,
      addressRecord,
    };
  };

  describe('without Smart Fields', () => {
    it('should not modify the record', async () => {
      expect.assertions(1);
      const { userRecord } = setup();

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
      const { userRecord } = setup();

      Schemas.schemas = { users: usersSchema };
      const fieldsPerModel = { users: ['id', 'smart'] };
      const injector = new SmartFieldsValuesInjector(userRecord, 'users', fieldsPerModel);
      await injector.perform();
      expect(userRecord.smart).toStrictEqual({ foo: 'bar' });
    });
  });

  describe('with a Smart Relationship that references a collection having a Smart Field', () => {
    const fieldsPerModel = { user: ['smart'], addresses: ['id', 'user', 'smartUser'], smartUser: ['smart'] };
    it('should inject the Smart Relationship reference', async () => {
      expect.assertions(3);

      const { addressRecord } = setup();

      Schemas.schemas = { users: usersSchema, addresses: addressesSchema };
      const injector = new SmartFieldsValuesInjector(addressRecord, 'addresses', fieldsPerModel);
      await injector.perform();
      expect(addressRecord.smartUser).not.toBeUndefined();
      expect(addressRecord.smartUser.smart).toStrictEqual({ foo: 'bar' });
      expect(addressRecord.user.smart).toStrictEqual({ foo: 'bar' });
    });
  });

  describe('with a Smart Relationship that reference a collection having a Smart Field whose name is a magic accessor', () => {
    // NOTICE: note the add of the `hasUser`/`hasAddress` function, this is for
    // mocking sequelize magic accessor
    const fieldsPerModel = { addresses: ['id', 'user', 'hasUser', 'smartUser', 'smartActors', 'islands'], user: ['smart', 'hasAddress'], smartUser: ['smart', 'hasAddress'] };
    it('should inject the Smart Relationship reference', async () => {
      expect.assertions(5);

      const { addressRecord } = setup();

      Schemas.schemas = { users: usersSchema, addresses: addressesSchema };
      const injector = new SmartFieldsValuesInjector(addressRecord, 'addresses', fieldsPerModel);
      await injector.perform();
      expect(addressRecord.smartActors).toStrictEqual([]);
      expect(addressRecord.islands).toStrictEqual(['HonoLulu', 'Tahiti']);
      expect(addressRecord.hasUser).toBe(true);
      expect(addressRecord.user.hasAddress).toBe(true);
      expect(addressRecord.smartUser.hasAddress).toBe(true);
    });
  });

  describe('with no fieldsPerModel', () => {
    const fieldsPerModel = undefined;
    it('should inject the Smart Relationship reference', async () => {
      expect.assertions(1);

      const { addressRecord } = setup();

      Schemas.schemas = { users: usersSchema, addresses: addressesSchema };
      const injector = new SmartFieldsValuesInjector(addressRecord, 'addresses', fieldsPerModel);
      await injector.perform();
      expect(addressRecord.user.smart).toStrictEqual({ foo: 'bar' });
    });
  });
});
