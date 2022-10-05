function CloseioCustomerLeadGetter(Implementation, params, opts, integrationInfo) {
  const Closeio = opts.integrations.closeio.closeio;
  const closeio = new Closeio(opts.integrations.closeio.apiKey);

  this.perform = () =>
    Implementation.Closeio.getCustomer(
      integrationInfo.collection,
      params.recordId,
    )
      .then((customer) => {
        if (!customer) { return { data: [] }; }

        const query = `name:"${customer[integrationInfo.field]
        }" or email:"${customer[integrationInfo.field]}"`;

        return closeio._get(`/lead?query=${encodeURIComponent(query)}`);
      })
      .then((response) => response.data[0]);
}

module.exports = CloseioCustomerLeadGetter;
