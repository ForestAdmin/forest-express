const ApplicationContext = require('../../src/context/application-context');
const ApimapSender = require('../../src/services/apimap-sender');

describe('services > apimap-sender', () => {
  const context = new ApplicationContext();
  const superagentRequestEndFunction = jest.fn();
  context.init((ctx) => ctx
    .addInstance('forestUrlGetter', jest.fn())
    .addInstance('logger', { warn: jest.fn(), error: jest.fn() })
    .addInstance('superagentRequest', {
      post: () => ({ send: () => ({ set: () => ({ end: superagentRequestEndFunction }) }) }),
    })
    .addClass(ApimapSender));

  const { apimapSender, logger } = context.inject();


  describe('send', () => {
    it('should post content then get response from forestUrlGetter', () => {
      expect.assertions(1);
      apimapSender.send();
      expect(superagentRequestEndFunction).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleResult', () => {
    describe('with no result provided', () => {
      it('should return early', () => {
        expect.assertions(1);
        expect(apimapSender.handleResult()).toBeUndefined();
      });
    });

    describe('when having a 20X status', () => {
      it('should be successful silently', () => {
        expect.assertions(3);
        [200, 202, 204].forEach((status) => {
          expect(apimapSender.handleResult({ status })).toBeUndefined();
        });
      });

      it('should log warning when result contains a body.warning value', () => {
        expect.assertions(3);
        [200, 202, 204].forEach((status) => {
          apimapSender.handleResult({ status, body: { warning: 'Oops' } });
          expect(logger.warn).toHaveBeenCalledWith(expect.stringMatching('Oops'));
        });
      });
    });

    it('should log a warning when having a 0 status', () => {
      expect.assertions(1);
      apimapSender.handleResult({ status: 0 });
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Are you online'));
    });

    it('should log an error when having a 404 status', () => {
      expect.assertions(1);
      apimapSender.handleResult({ status: 404 });
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Cannot find'));
    });

    it('should log a warning when having a 503 status', () => {
      expect.assertions(1);
      apimapSender.handleResult({ status: 503 });
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Forest is in maintenance'));
    });

    it('should log an error when having an unhandled status', () => {
      expect.assertions(1);
      apimapSender.handleResult({ status: 12345 });
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('An error occured'));
    });
  });
});
