const {
  Unauthorized,
  UnprocessableEntity,
  InvalidFiltersFormat,
  NoMatchingOperatorError,
} = require('../../src/utils/error');

describe('services > error', () => {
  describe('unauthorized', () => {
    it('should create an error object with name "Unauthorized" and status 401', () => {
      expect.assertions(2);
      const error = new Unauthorized('Invalid token');
      expect(error.name).toStrictEqual('Unauthorized');
      expect(error.status).toStrictEqual(401);
    });

    it('should create display a custom error message', () => {
      expect.assertions(1);
      const throwError = () => { throw new Unauthorized('Invalid token'); };
      expect(() => throwError()).toThrow('Invalid token');
    });
  });

  describe('unprocessableEntity', () => {
    it('should create an error object with name "UnprocessableEntity" and status 422', () => {
      expect.assertions(2);
      const error = new UnprocessableEntity('Invalid user email');
      expect(error.name).toStrictEqual('UnprocessableEntity');
      expect(error.status).toStrictEqual(422);
    });

    it('should create display a custom error message', () => {
      expect.assertions(1);
      const throwError = () => { throw new UnprocessableEntity('Invalid user email'); };
      expect(() => throwError()).toThrow('Invalid user email');
    });
  });

  describe('invalidFiltersFormat', () => {
    it('should create an error object with name "InvalidFiltersFormat" and status 422', () => {
      expect.assertions(2);
      const error = new InvalidFiltersFormat();
      expect(error.name).toStrictEqual('InvalidFiltersFormat');
      expect(error.status).toStrictEqual(422);
    });

    it('should create display a default message', () => {
      expect.assertions(1);
      const throwError = () => { throw new InvalidFiltersFormat(); };
      expect(() => throwError()).toThrow('The filters format is not a valid JSON string.');
    });
  });

  describe('noMatchingOperatorError', () => {
    it('should create an error object with name "NoMatchingOperatorError" and status 422', () => {
      expect.assertions(2);
      const error = new NoMatchingOperatorError();
      expect(error.name).toStrictEqual('NoMatchingOperatorError');
      expect(error.status).toStrictEqual(422);
    });

    it('should create display a default message', () => {
      expect.assertions(1);
      const throwError = () => { throw new NoMatchingOperatorError(); };
      expect(() => throwError()).toThrow('The given operator is not handled.');
    });
  });
});
