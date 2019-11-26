function CloseioLeadEmailsGetter(Implementation, params, opts) {
  const Closeio = opts.integrations.closeio.closeio;
  const closeio = new Closeio(opts.integrations.closeio.apiKey);

  this.perform = () =>
    closeio._get(`/activity/email/?lead_id=${params.leadId}`)
      .then((results) => [results.data.length, results.data]);
}

module.exports = CloseioLeadEmailsGetter;
