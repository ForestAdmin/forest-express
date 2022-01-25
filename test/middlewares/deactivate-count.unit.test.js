const deactivateCount = require('../../src/middlewares/count');

describe('middlewares > deactivateCount', () => {
  it('should return the right metadata', async () => {
    expect.assertions(2);

    const reqMock = { };
    const statusMock = { send: () => { } };
    const respMock = { status: () => statusMock };
    const sendResult = jest.spyOn(statusMock, 'send');
    const statusResult = jest.spyOn(respMock, 'status').mockImplementation(() => statusMock);

    deactivateCount(reqMock, respMock);

    expect(statusResult).toHaveBeenCalledWith(200);
    expect(sendResult).toHaveBeenCalledWith({
      meta: {
        count: 'deactivated',
      },
    });
  });
});
