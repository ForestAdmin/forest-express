const {
  retrieve,
  isIpValid,
  isIpWhitelistRetrieved,
} = require('../../src/services/ip-whitelist');
const context = require('../../src/context');

describe('utils › services', () => {
  const servicesBuilder = (applicationContext) => {
    applicationContext.addInstance('forestServerRequester', {
      perform: jest
        .fn()
        .mockResolvedValue({
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
        }),
    });
  };

  context.init(servicesBuilder);
  it('should consider valid IP as valid', async () => {
    expect.assertions(4);
    await retrieve();
    expect(isIpWhitelistRetrieved()).toBe(true);
    expect(isIpValid('1.0.0.0')).toBe(true);
    expect(isIpValid('1.0.1.0')).toBe(true);
    expect(isIpValid('1.2.0.0')).toBe(true);
  });
  it('should consider invalid IP as invalid', async () => {
    expect.assertions(2);
    await retrieve();
    expect(isIpWhitelistRetrieved()).toBe(true);
    expect(isIpValid('1.3.0.0')).toBe(false);
  });
});
