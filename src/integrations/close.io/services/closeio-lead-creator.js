'use strict';

function CloseioLeadCreator(Implementation, params, opts) {
  var Closeio = opts.integrations.closeio.closeio;
  var closeio = new Closeio(opts.integrations.closeio.apiKey);

  this.perform = function () {
    var attrs = params.data.attributes.values;
    return closeio.lead.create({
      name: attrs['Company/Organization Name'],
      contacts: [{
        name: attrs['Contact Name']
      }]
    });
  };
}

module.exports = CloseioLeadCreator;
