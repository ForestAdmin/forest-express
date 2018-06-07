const P = require('bluebird');

function IpWhitelistDeserializer(data) {
  this.perform = function () {
    return P.try(() => {
      const deserialiazedData = {};

      deserialiazedData.useIpWhitelist = data.attributes.use_ip_whitelist;
      deserialiazedData.rules = data.attributes.rules.map((rule) => {
        if (rule.ip_minimum) {
          rule.ipMinimum = rule.ip_minimum;
          delete rule.ip_minimum;
        }
        if (rule.ip_maximum) {
          rule.ipMaximum = rule.ip_maximum;
          delete rule.ip_maximum;
        }

        return rule;
      });

      return deserialiazedData;
    });
  };
}

module.exports = IpWhitelistDeserializer;
