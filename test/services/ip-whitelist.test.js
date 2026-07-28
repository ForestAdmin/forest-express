const {
  retrieve,
  isIpValid,
  isIpWhitelistRetrieved,
} = require('../../src/services/ip-whitelist');
const forestServerRequester = require('../../src/services/forest-server-requester');
const logger = require('../../src/services/logger');

jest.mock('../../src/services/forest-server-requester');
jest.mock('../../src/services/logger');

describe('utils › services', () => {
  forestServerRequester.perform.mockResolvedValue({
    data: {
      attributes: {
        use_ip_whitelist: true,
        rules: [
          {
            type: 1,
            ip_minimum: '1.0.0.0',
            ip_maximum: '1.2.0.0',
          },
        ],
      },
    },
  });
  it('should consider valid IP as valid', async () => {
    await retrieve();
    expect(isIpWhitelistRetrieved()).toBe(true);
    expect(isIpValid('1.0.0.0')).toBe(true);
    expect(isIpValid('1.0.1.0')).toBe(true);
    expect(isIpValid('1.2.0.0')).toBe(true);
  });
  it('should consider invalid IP as invalid', async () => {
    await retrieve();
    expect(isIpWhitelistRetrieved()).toBe(true);
    expect(isIpValid('1.3.0.0')).toBe(false);
  });

  describe('per rule type', () => {
    it('should match an exact IP rule (type 0)', async () => {
      forestServerRequester.perform.mockResolvedValueOnce({
        data: { attributes: { use_ip_whitelist: true, rules: [{ type: 0, ip: '1.0.0.0' }] } },
      });
      await retrieve();
      expect(isIpValid('1.0.0.0')).toBe(true);
      expect(isIpValid('1.0.0.1')).toBe(false);
    });

    it('should match a subnet rule (type 2)', async () => {
      forestServerRequester.perform.mockResolvedValueOnce({
        data: { attributes: { use_ip_whitelist: true, rules: [{ type: 2, range: '1.0.0.0/24' }] } },
      });
      await retrieve();
      expect(isIpValid('1.0.0.128')).toBe(true);
      expect(isIpValid('1.0.1.0')).toBe(false);
    });

    it('should match an IPv6 IP rule', async () => {
      forestServerRequester.perform.mockResolvedValueOnce({
        data: { attributes: { use_ip_whitelist: true, rules: [{ type: 0, ip: '::1' }] } },
      });
      await retrieve();
      expect(isIpValid('::1')).toBe(true);
      expect(isIpValid('::2')).toBe(false);
    });

    it('should consider a malformed IP as invalid', async () => {
      forestServerRequester.perform.mockResolvedValueOnce({
        data: { attributes: { use_ip_whitelist: true, rules: [{ type: 0, ip: '1.0.0.0' }] } },
      });
      await retrieve();
      expect(isIpValid('not-an-ip')).toBe(false);
    });
  });

  describe('when a rule is malformed', () => {
    it('should ignore an unknown rule type instead of throwing', async () => {
      forestServerRequester.perform.mockResolvedValueOnce({
        data: { attributes: { use_ip_whitelist: true, rules: [{ type: 99 }] } },
      });
      await retrieve();
      expect(() => isIpValid('1.0.0.0')).not.toThrow();
      expect(isIpValid('1.0.0.0')).toBe(false);
    });

    it('should ignore an inverted range instead of throwing', async () => {
      forestServerRequester.perform.mockResolvedValueOnce({
        data: {
          attributes: {
            use_ip_whitelist: true,
            rules: [{ type: 1, ip_minimum: '1.2.0.0', ip_maximum: '1.0.0.0' }],
          },
        },
      });
      await retrieve();
      expect(() => isIpValid('1.1.0.0')).not.toThrow();
      expect(isIpValid('1.1.0.0')).toBe(false);
    });

    it('should ignore a subnet rule without a prefix instead of throwing', async () => {
      forestServerRequester.perform.mockResolvedValueOnce({
        data: {
          attributes: { use_ip_whitelist: true, rules: [{ type: 2, range: '1.0.0.0' }] },
        },
      });
      await retrieve();
      expect(() => isIpValid('1.0.0.0')).not.toThrow();
      expect(isIpValid('1.0.0.0')).toBe(false);
    });

    it('should still evaluate valid rules when another rule is malformed', async () => {
      forestServerRequester.perform.mockResolvedValueOnce({
        data: {
          attributes: {
            use_ip_whitelist: true,
            rules: [
              { type: 99 },
              { type: 1, ip_minimum: '1.0.0.0', ip_maximum: '1.2.0.0' },
            ],
          },
        },
      });
      await retrieve();
      expect(isIpValid('1.1.0.0')).toBe(true);
    });

    it('should report it once when the rules are refreshed, not on every check', async () => {
      forestServerRequester.perform.mockResolvedValueOnce({
        data: { attributes: { use_ip_whitelist: true, rules: [{ type: 2, range: '1.0.0.0' }] } },
      });
      logger.warn.mockClear();

      await retrieve();

      expect(logger.warn).toHaveBeenCalledTimes(1);

      isIpValid('1.0.0.0');
      isIpValid('1.0.0.1');

      expect(logger.warn).toHaveBeenCalledTimes(1);
    });
  });
});
