'use strict';

function CloseioCustomerLeadGetter(Implementation, params, opts, integrationInfo) {
  var Closeio = opts.integrations.closeio.closeio;
  var closeio = new Closeio(opts.integrations.closeio.apiKey);

  this.perform = function () {
    return Implementation.Closeio.getCustomer(integrationInfo.collection,
      params.recordId)
      .then(function (customer) {
        if (!customer) { return { data: [] }; }

        return closeio._get('/lead?query=' +
          encodeURIComponent('name:"' + customer[integrationInfo.field] +
          '" or email:"' + customer[integrationInfo.field] + '"'));
      })
      .then(function (response) {
        return response.data[0];
      });
  };
}

module.exports = CloseioCustomerLeadGetter;
