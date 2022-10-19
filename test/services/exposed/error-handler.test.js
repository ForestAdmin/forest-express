const sinon = require('sinon');
const errorHandler = require('../../../src/services/exposed/error-handler');
const ForbiddenError = require('../../../src/utils/errors/forbidden-error').default;

class FakePayloadError extends ForbiddenError {
  constructor(...args) {
    super(...args);

    this.name = this.constructor.name;
    this.data = {
      property: 'value',
    };
  }
}

describe('services › exposed › error-handler', () => {
  function mockResponse() {
    return {
      status: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis(),
    };
  }

  it('calls next if there is no error', () => {
    const next = sinon.stub();
    const handleError = errorHandler();

    handleError(undefined, undefined, undefined, next);

    expect(next.callCount).toBe(1);
  });

  it('uses the first error\'s message as the message if the error contains multiple errors', () => {
    const error = {
      errors: [{
        message: 'First message',
        name: 'FirstNameError',
      }, {
        message: 'Second message',
      }],
      message: 'Root message',
    };

    const next = sinon.stub();
    const response = mockResponse();
    const handleError = errorHandler();

    handleError(error, undefined, response, next);

    expect(next.callCount).toBe(0);
    expect(response.status.callCount).toBe(1);
    expect(response.status.firstCall.args).toStrictEqual([500]);
    expect(response.send.callCount).toBe(1);
    expect(response.send.firstCall.args).toStrictEqual([{
      errors: [{
        status: 500,
        detail: 'First message',
        name: 'FirstNameError',
      }],
    }]);
  });

  it('uses the first error\'s name as the name if the error contains multiple errors', () => {
    const error = {
      errors: [{
        message: 'First message',
        name: 'FirstNameError',
      }, {
        message: 'Second message',
        name: 'SecondNameError',
      }],
      name: 'Root name',
    };

    const next = sinon.stub();
    const response = mockResponse();
    const handleError = errorHandler();

    handleError(error, undefined, response, next);

    expect(response.send.firstCall.args).toStrictEqual([{
      errors: [{
        status: 500,
        detail: 'First message',
        name: 'FirstNameError',
      }],
    }]);
  });

  it('logs the unexpected error if the error does not have a status', () => {
    const error = new Error('The error');
    const logger = { error: sinon.stub() };
    const handleError = errorHandler({ logger });
    const next = sinon.stub();
    const response = mockResponse();

    handleError(error, undefined, response, next);

    expect(logger.error.callCount).toBe(1);
    expect(logger.error.firstCall.args).toStrictEqual(['Unexpected error: ', error]);
  });

  it("uses the error's message, name and status to construct the JSON response", () => {
    const response = mockResponse();
    const error = new Error('Something bad happened');
    error.status = 666;

    const handleError = errorHandler();
    const next = sinon.stub();

    handleError(error, undefined, response, next);

    expect(next.callCount).toBe(0);
    expect(response.status.callCount).toBe(1);
    expect(response.status.firstCall.args).toStrictEqual([
      666,
    ]);
    expect(response.send.callCount).toBe(1);
    expect(response.send.firstCall.args).toStrictEqual([{
      errors: [{
        detail: 'Something bad happened',
        status: 666,
        name: 'Error',
      }],
    }]);
  });

  describe('with an error that supports data (payload)', () => {
    it('should add data to the body JSON response', () => {
      const response = mockResponse();
      const error = new FakePayloadError('message');

      const handleError = errorHandler();
      const next = sinon.stub();

      handleError(error, undefined, response, next);

      expect(next.callCount).toBe(0);
      expect(response.status.callCount).toBe(1);
      expect(response.status.firstCall.args).toStrictEqual([
        403,
      ]);
      expect(response.send.callCount).toBe(1);
      expect(response.send.firstCall.args).toStrictEqual([{
        errors: [{
          detail: 'message',
          status: 403,
          name: 'FakePayloadError',
          data: {
            property: 'value',
          },
        }],
      }]);
    });
  });
});
