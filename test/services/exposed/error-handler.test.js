const sinon = require('sinon');
const errorHandler = require('../../../src/services/exposed/error-handler');

describe('services › exposed › error-handler', () => {
  function mockResponse() {
    return {
      status: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis(),
    };
  }

  it('calls next if there is no error', () => {
    expect.assertions(1);
    const next = sinon.stub();
    const handleError = errorHandler();

    handleError(undefined, undefined, undefined, next);

    expect(next.callCount).toBe(1);
  });

  it('uses the first error\'s message as the message if the error contains multiple errors', () => {
    expect.assertions(5);
    const error = {
      errors: [{
        message: 'First message',
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
        name: undefined,
      }],
    }]);
  });

  it('uses the first error\'s name as the name if the error contains multiple errors', () => {
    expect.assertions(1);
    const error = {
      errors: [{
        message: 'First message',
        name: 'FirstNameError',
      }, {
        message: 'Second message',
        name: 'FirstNameError',
      }],
      message: 'Root message',
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
    expect.assertions(2);

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
    expect.assertions(5);

    const response = mockResponse();
    const error = new Error('Something bad happened');
    error.status = 666;
    error.name = 'SomethingWrongHappenedError';

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
        name: 'SomethingWrongHappenedError',
      }],
    }]);
  });
});
