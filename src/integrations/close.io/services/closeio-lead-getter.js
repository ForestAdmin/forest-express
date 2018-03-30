'use strict';

function CloseioLeadGetter(Implementation, params, opts) {
  var Closeio = opts.integrations.closeio.closeio;
  var closeio = new Closeio(opts.integrations.closeio.apiKey);

  this.perform = function () {
    return closeio._get('/lead/' + params.leadId);
  };
}

module.exports = CloseioLeadGetter;
