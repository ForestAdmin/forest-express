const SmartActionFieldValidator = require('../../src/services/smart-action-field-validator');

const smartActionFieldValidator = new SmartActionFieldValidator();

describe('services > smart-action-field-validator', () => {
  describe('validateField', () => {
    describe('when the field is valid', () => {
      it('should do nothing', () => {
        expect.assertions(1);

        const actionName = 'actionTest';
        const field = {
          field: 'test',
          description: 'a description',
          isRequired: false,
          isReadOnly: false,
          type: 'String',
        };

        expect(() => smartActionFieldValidator.validateField(field, actionName)).not.toThrow();
      });
    });

    describe('when the field is not an object', () => {
      it('should throw if field is null', () => {
        expect.assertions(1);

        const actionName = 'actionTest';
        const field = null;

        expect(() => smartActionFieldValidator.validateField(field, actionName)).toThrow(`Field inside fields array on the smart action "${actionName}" must be an object.`);
      });

      it('should throw if field is an array', () => {
        expect.assertions(1);

        const actionName = 'actionTest';
        const field = [];

        expect(() => smartActionFieldValidator.validateField(field, actionName)).toThrow(`Field inside fields array on the smart action "${actionName}" must be an object.`);
      });

      it('should throw if field is a function', () => {
        expect.assertions(1);

        const actionName = 'actionTest';
        const field = () => {};

        expect(() => smartActionFieldValidator.validateField(field, actionName)).toThrow(`Field inside fields array on the smart action "${actionName}" must be an object.`);
      });
    });

    describe('when the field property is not valid', () => {
      const generateField = () => ({ field: 'test' });

      it('should throw if field.field is not defined', () => {
        expect.assertions(1);

        const actionName = 'actionTest';
        const field = {};

        expect(() => smartActionFieldValidator.validateField(field, actionName)).toThrow(`field attribute inside fields array on the smart action "${actionName}" must be defined.`);
      });

      it('should throw if field.field is not a string', () => {
        expect.assertions(1);

        const actionName = 'actionTest';
        const field = generateField();
        field.field = 1;

        expect(() => smartActionFieldValidator.validateField(field, actionName)).toThrow(`field attribute inside fields array on the smart action "${actionName}" must be a string.`);
      });

      it('should throw if field.description is not a string', () => {
        expect.assertions(1);

        const actionName = 'actionTest';
        const field = generateField();
        field.description = () => {};

        expect(() => smartActionFieldValidator.validateField(field, actionName)).toThrow(`description of "${field.field}" on the smart action "${actionName}" must be a string.`);
      });

      describe('when field have enums property', () => {
        it('should throw if it is not an array', () => {
          expect.assertions(1);

          const actionName = 'actionTest';
          const field = generateField();
          field.enums = () => {};

          expect(() => smartActionFieldValidator.validateField(field, actionName)).toThrow(`enums of "${field.field}" on the smart action "${actionName}" must be an array.`);
        });

        it('should throw if contains null option', () => {
          expect.assertions(1);

          const actionName = 'actionTest';
          const field = generateField();
          field.enums = ['valid', null, 'another valid'];

          expect(() => smartActionFieldValidator.validateField(field, actionName)).toThrow(`Invalid null or undefined option inside "${field.field}" on the smart action "${actionName}".`);
        });

        it('should throw if contains undefined option', () => {
          expect.assertions(1);

          const actionName = 'actionTest';
          const field = generateField();
          field.enums = ['valid', undefined, 'another valid'];

          expect(() => smartActionFieldValidator.validateField(field, actionName)).toThrow(`Invalid null or undefined option inside "${field.field}" on the smart action "${actionName}".`);
        });
      });

      it('should throw if field.isRequired is not a boolean', () => {
        expect.assertions(1);

        const actionName = 'actionTest';
        const field = generateField();
        field.isRequired = 1;

        expect(() => smartActionFieldValidator.validateField(field, actionName)).toThrow(`isRequired of "${field.field}" on the smart action "${actionName}" must be a boolean.`);
      });

      it('should throw if field.isReadOnly is not a boolean', () => {
        expect.assertions(1);

        const actionName = 'actionTest';
        const field = generateField();
        field.isReadOnly = 1;

        expect(() => smartActionFieldValidator.validateField(field, actionName)).toThrow(`isReadOnly of "${field.field}" on the smart action "${actionName}" must be a boolean.`);
      });

      it('should throw if field.reference is not a string', () => {
        expect.assertions(1);

        const actionName = 'actionTest';
        const field = generateField();
        field.reference = 1;

        expect(() => smartActionFieldValidator.validateField(field, actionName)).toThrow(`reference of "${field.field}" on the smart action "${actionName}" must be a string.`);
      });

      it('should throw if field.type is not a valid type', () => {
        expect.assertions(1);

        const actionName = 'actionTest';
        const field = generateField();
        field.type = 1;

        expect(() => smartActionFieldValidator.validateField(field, actionName)).toThrow(`type of "${field.field}" on the smart action "${actionName}" must be a valid type. See the documentation for more information. https://docs.forestadmin.com/documentation/reference-guide/fields/create-and-manage-smart-fields#available-field-options`);
      });
    });
  });

  describe('validateFieldChangeHook', () => {
    describe('when the field does not use the change hook feature', () => {
      it('should do nothing', () => {
        expect.assertions(1);

        const field = { field: 'test' };
        const actionName = 'actionTest';
        const hooks = [];

        expect(() => smartActionFieldValidator.validateFieldChangeHook(field, actionName, hooks))
          .not.toThrow();
      });
    });

    describe('when the field uses the hook feature', () => {
      describe('when the hook is correctly defined', () => {
        it('should do nothing', () => {
          expect.assertions(1);

          const field = { field: 'test', hook: 'onChange' };
          const actionName = 'actionTest';
          const hooks = {
            onChange: () => {},
          };

          expect(() => smartActionFieldValidator.validateFieldChangeHook(field, actionName, hooks))
            .not.toThrow();
        });
      });

      describe('when the field hook does not exist', () => {
        it('should throw an error', () => {
          expect.assertions(1);

          const field = { field: 'test', hook: 'onChange' };
          const actionName = 'actionTest';
          const hooks = {};

          expect(() => smartActionFieldValidator.validateFieldChangeHook(field, actionName, hooks))
            .toThrow(`The hook "${field.hook}" of "${field.field}" field on the smart action "${actionName}" is not defined.`);
        });
      });
    });
  });

  describe('validateSmartActionFields', () => {
    describe('when the action does not have any fields', () => {
      it('should do nothing', () => {
        expect.assertions(3);

        jest.resetAllMocks();

        const validateFieldSpy = jest.spyOn(smartActionFieldValidator, 'validateField');
        const validateFieldChangeHook = jest.spyOn(smartActionFieldValidator, 'validateFieldChangeHook');

        const action = {};
        const collectionName = 'collectionTest';

        expect(() => smartActionFieldValidator.validateSmartActionFields(action, collectionName))
          .not.toThrow();
        expect(validateFieldSpy).not.toHaveBeenCalled();
        expect(validateFieldChangeHook).not.toHaveBeenCalled();
      });
    });

    describe('when the action uses incorrect parameters', () => {
      it('should throw an error for fields not being an array', () => {
        expect.assertions(3);

        jest.resetAllMocks();

        const validateFieldSpy = jest.spyOn(smartActionFieldValidator, 'validateField');
        const validateFieldChangeHook = jest.spyOn(smartActionFieldValidator, 'validateFieldChangeHook');

        const action = { fields: 'toto' };
        const collectionName = 'collectionTest';

        expect(() => smartActionFieldValidator.validateSmartActionFields(action, collectionName))
          .toThrow(`Cannot find the fields you defined for the Smart action "${action.name}" of your "${collectionName}" collection. The fields option must be an array.`);
        expect(validateFieldSpy).not.toHaveBeenCalled();
        expect(validateFieldChangeHook).not.toHaveBeenCalled();
      });
    });

    it('should call validateFieldSpy and validateFieldChangeHook on each fields', () => {
      expect.assertions(3);

      jest.resetAllMocks();

      const validateFieldSpy = jest.spyOn(smartActionFieldValidator, 'validateField');
      const validateFieldChangeHook = jest.spyOn(smartActionFieldValidator, 'validateFieldChangeHook');

      const action = { fields: [{ field: 'toto' }, { field: 'tata' }] };
      const collectionName = 'collectionTest';

      expect(() => smartActionFieldValidator.validateSmartActionFields(action, collectionName))
        .not.toThrow();
      expect(validateFieldSpy).toHaveBeenCalledTimes(2);
      expect(validateFieldChangeHook).toHaveBeenCalledTimes(2);
    });
  });
});
