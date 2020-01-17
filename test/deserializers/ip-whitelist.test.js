const IpWhitelistDeserializer = require('../../src/deserializers/ip-whitelist');

describe('deserializers > ip-whitelist', () => {
  it('should transform IP properties and preserve everything else', async () => {
    expect.assertions(1);

    const attributes = {
      use_ip_whitelist: true,
      rules: [
        {
          ip_minimum: '1.0.0.0',
          ip_maximum: '1.2.0.0',
        },
        {
          foo: 'bar',
        },
        {
          foo: 'bar',
          ip_minimum: '2.0.0.0',
          ip_maximum: '2.2.0.0',
        },
      ],
    };

    const expected = {
      useIpWhitelist: true,
      rules: [
        {
          ipMinimum: '1.0.0.0',
          ipMaximum: '1.2.0.0',
        },
        {
          foo: 'bar',
        },
        {
          foo: 'bar',
          ipMinimum: '2.0.0.0',
          ipMaximum: '2.2.0.0',
        },
      ],
    };

    const deserialiazedData = await (new IpWhitelistDeserializer({ attributes })).perform();
    expect(deserialiazedData).toStrictEqual(expected);
  });
});
