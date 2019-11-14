

function CloseioLeadCreator(Implementation, params, opts) {
  const Closeio = opts.integrations.closeio.closeio;
  const closeio = new Closeio(opts.integrations.closeio.apiKey);

  this.perform = function () {
    const attrs = params.data.attributes.values;
    return closeio.lead.create({
      name: attrs['Company/Organization Name'],
      contacts: [{
        name: attrs['Contact Name'],
      }],
    });
  };
}

module.exports = CloseioLeadCreator;
