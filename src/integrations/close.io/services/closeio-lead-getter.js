

function CloseioLeadGetter(Implementation, params, opts) {
  const Closeio = opts.integrations.closeio.closeio;
  const closeio = new Closeio(opts.integrations.closeio.apiKey);

  this.perform = function () {
    return closeio._get(`/lead/${params.leadId}`);
  };
}

module.exports = CloseioLeadGetter;
