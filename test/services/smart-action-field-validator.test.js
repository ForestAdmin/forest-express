const SmartActionFieldValidator = require('../../src/services/smart-action-field-validator');

const smartActionFieldValidator = new SmartActionFieldValidator();

describe('services > smart-action-field-validator', () => {
  describe('validateField', () => {
    it('should not throw if the field is valid', () => {
      expect.assertions(1);

      const field = {
        field: 'test',
        description: 'a description',
        isRequired: false,
        isReadOnly: false,
        type: 'String',
      };

      expect(() => smartActionFieldValidator.validateField(field)).not.toThrow();
    });

    describe('when the field is not an object', () => {
      it('should throw if field is null', () => {
        expect.assertions(1);

        const field = null;

        expect(() => smartActionFieldValidator.validateField(field)).toThrow('Field must be an object.');
      });

      it('should throw if field is an array', () => {
        expect.assertions(1);

        const field = [];

        expect(() => smartActionFieldValidator.validateField(field)).toThrow('Field must be an object.');
      });

      it('should throw if field is a function', () => {
        expect.assertions(1);

        const field = () => {};

        expect(() => smartActionFieldValidator.validateField(field)).toThrow('Field must be an object.');
      });
    });

    describe('when the field property is not valid', () => {
      const generateField = () => ({ field: 'test' });

      it('should throw if field.field is not defined', () => {
        expect.assertions(1);

        const field = {};

        expect(() => smartActionFieldValidator.validateField(field)).toThrow('field attribute must be defined.');
      });

      it('should throw if field.field is not a string', () => {
        expect.assertions(1);

        const field = generateField();
        field.field = 1;

        expect(() => smartActionFieldValidator.validateField(field)).toThrow('field attribute must be a string.');
      });

      it('should throw if field.description is not a string', () => {
        expect.assertions(1);

        const field = generateField();
        field.description = () => {};

        expect(() => smartActionFieldValidator.validateField(field)).toThrow(`description of "${field.field}" must be a string.`);
      });

      it('should throw if field.enums is not an array', () => {
        expect.assertions(1);

        const field = generateField();
        field.enums = () => {};

        expect(() => smartActionFieldValidator.validateField(field)).toThrow(`enums of "${field.field}" must be an array.`);
      });

      it('should throw if field.isRequired is not a boolean', () => {
        expect.assertions(1);

        const field = generateField();
        field.isRequired = 1;

        expect(() => smartActionFieldValidator.validateField(field)).toThrow(`isRequired of "${field.field}" must be a boolean.`);
      });

      it('should throw if field.isReadOnly is not a boolean', () => {
        expect.assertions(1);

        const field = generateField();
        field.isReadOnly = 1;

        expect(() => smartActionFieldValidator.validateField(field)).toThrow(`isReadOnly of "${field.field}" must be a boolean.`);
      });

      it('should throw if field.reference is not a string', () => {
        expect.assertions(1);

        const field = generateField();
        field.reference = 1;

        expect(() => smartActionFieldValidator.validateField(field)).toThrow(`reference of "${field.field}" must be a string.`);
      });

      it('should throw if field.type is not a valid type', () => {
        expect.assertions(1);

        const field = generateField();
        field.type = 1;

        expect(() => smartActionFieldValidator.validateField(field)).toThrow(`type of "${field.field}" must be a valid type. See the documentation for more information. https://docs.forestadmin.com/documentation/reference-guide/fields/create-and-manage-smart-fields#available-field-options`);
      });
    });
  });
});
