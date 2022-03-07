const deactivateCount = require('../../src/middlewares/count');

describe('middlewares > deactivateCount', () => {
  describe('when on a count route', () => {
    it('should return the right metadata', async () => {
      expect.assertions(2);

      const reqMock = { path: 'collection1/count' };
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

  describe('when not on a count route', () => {
    it('should return an error', async () => {
      expect.assertions(2);

      const reqMock = { path: 'collection1/:recordId' };
      const statusMock = { send: () => { } };
      const respMock = { status: () => statusMock };

      const sendResult = jest.spyOn(statusMock, 'send');
      const statusResult = jest.spyOn(respMock, 'status').mockImplementation(() => statusMock);

      deactivateCount(reqMock, respMock);

      expect(statusResult).toHaveBeenCalledWith(400);
      expect(sendResult).toHaveBeenCalledWith({
        error: 'The deactiveCount middleware can only be used in count routes.',
      });
    });
  });
});
