const P = require('bluebird');

function IpWhitelistDeserializer(data) {
  this.perform = () =>
    P.try(() => ({
      useIpWhitelist: data.attributes.use_ip_whitelist,
      rules: data.attributes.rules.map((rule) => {
        const { ip_minimum: ipMinimum, ip_maximum: ipMaximum, ...rest } = rule;
        if (ipMinimum) rest.ipMinimum = ipMinimum;
        if (ipMaximum) rest.ipMaximum = ipMaximum;
        return rest;
      }),
    }));
}

module.exports = IpWhitelistDeserializer;
