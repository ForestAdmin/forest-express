const {
  Unauthorized,
  UnprocessableEntity,
  InvalidFiltersFormat,
  NoMatchingOperatorError,
} = require('../../src/utils/error');

describe('services > error', () => {
  describe('unauthorized', () => {
    it('should create an error object with name "Unauthorized" and status 401', () => {
      const error = new Unauthorized('Invalid token');
      expect(error.name).toBe('Unauthorized');
      expect(error.status).toBe(401);
    });

    it('should create display a custom error message', () => {
      const throwError = () => { throw new Unauthorized('Invalid token'); };
      expect(() => throwError()).toThrow('Invalid token');
    });
  });

  describe('unprocessableEntity', () => {
    it('should create an error object with name "UnprocessableEntity" and status 422', () => {
      const error = new UnprocessableEntity('Invalid user email');
      expect(error.name).toBe('UnprocessableEntity');
      expect(error.status).toBe(422);
    });

    it('should create display a custom error message', () => {
      const throwError = () => { throw new UnprocessableEntity('Invalid user email'); };
      expect(() => throwError()).toThrow('Invalid user email');
    });
  });

  describe('invalidFiltersFormat', () => {
    it('should create an error object with name "InvalidFiltersFormat" and status 422', () => {
      const error = new InvalidFiltersFormat();
      expect(error.name).toBe('InvalidFiltersFormat');
      expect(error.status).toBe(422);
    });

    it('should create display a default message', () => {
      const throwError = () => { throw new InvalidFiltersFormat(); };
      expect(() => throwError()).toThrow('The filters format is not a valid JSON string.');
    });
  });

  describe('noMatchingOperatorError', () => {
    it('should create an error object with name "NoMatchingOperatorError" and status 422', () => {
      const error = new NoMatchingOperatorError();
      expect(error.name).toBe('NoMatchingOperatorError');
      expect(error.status).toBe(422);
    });

    it('should create display a default message', () => {
      const throwError = () => { throw new NoMatchingOperatorError(); };
      expect(() => throwError()).toThrow('The given operator is not handled.');
    });
  });
});
