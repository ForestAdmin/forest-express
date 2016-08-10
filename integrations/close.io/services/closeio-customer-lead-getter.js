'use strict';

function CloseioCustomerLeadGetter(Implementation, params, opts) {
  var userModel = null;
  var Closeio = opts.integrations.closeio.closeio;
  var closeio = new Closeio(opts.integrations.closeio.apiKey);

  this.perform = function () {
    var userCollectionName = opts.integrations.closeio.mapping;
    userModel = Implementation.getModels()[userCollectionName];

    return Implementation.Closeio.getCustomer(userModel, params.recordId)
      .then(function (customer) {
        if (!customer) { return { data: [] }; }

        return closeio._get('/lead?query=name=' + customer.name);
      })
      .then(function (response) {
        return response.data[0];
      });
  };
}

module.exports = CloseioCustomerLeadGetter;
