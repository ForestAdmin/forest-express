const _ = require('lodash');
const auth = require('../../services/auth');
const path = require('../../services/path');
const IntegrationInformationsGetter = require('../../services/integration-informations-getter');
const CloseioLeadGetter = require('./services/closeio-lead-getter');
const CloseioLeadEmailsGetter = require('./services/closeio-lead-emails-getter');
const CloseioLeadEmailGetter = require('./services/closeio-lead-email-getter');
const CloseioCustomerLeadGetter = require('./services/closeio-customer-lead-getter');
const CloseioLeadCreator = require('./services/closeio-lead-creator');
const serializeCloseioLeads = require('./serializers/closeio-leads');
const serializeCloseioLeadEmails = require('./serializers/closeio-lead-emails');
const context = require('../../context');

module.exports = function Routes(app, model, Implementation, opts) {
  const { modelsManager } = context.inject();
  const modelName = Implementation.getModelName(model);
  let integrationInfo;

  if (opts.integrations && opts.integrations.closeio) {
    integrationInfo = new IntegrationInformationsGetter(
      modelName,
      Implementation, opts.integrations.closeio,
    ).perform();
  }

  if (integrationInfo) {
    const integrationValues = integrationInfo.split('.');
    integrationInfo = {
      collection: modelsManager.getModels()[integrationValues[0]],
      field: integrationValues[1],
    };
  }

  function closeioLead(req, res, next) {
    new CloseioLeadGetter(Implementation, _.extend(req.query, req.params), opts)
      .perform()
      .then((lead) => serializeCloseioLeads(lead, modelName))
      .then((lead) => {
        res.send(lead);
      }, next);
  }

  function closeioLeadEmails(req, res, next) {
    new CloseioLeadEmailsGetter(
      Implementation,
      _.extend(req.query, req.params), opts,
    )
      .perform()
      .then((results) => {
        const count = results[0];
        const emails = results[1];

        return serializeCloseioLeadEmails(emails, modelName, {
          count,
        });
      })
      .then((emails) => {
        res.send(emails);
      }, next);
  }

  function customerLead(request, response) {
    new CloseioCustomerLeadGetter(
      Implementation,
      _.extend(request.query, request.params),
      opts,
      integrationInfo,
    )
      .perform()
      .then((lead) => {
        if (!lead) { throw new Error('not_found'); }
        return serializeCloseioLeads(lead, modelName);
      })
      .then((lead) => {
        response.send(lead);
      })
      .catch(() => {
        response.send({ meta: {} });
      });
  }

  function closeioLeadEmail(req, res, next) {
    new CloseioLeadEmailGetter(Implementation, _.extend(
      req.query,
      req.params,
    ), opts)
      .perform()
      .then((email) => serializeCloseioLeadEmails(email, modelName))
      .then((email) => {
        res.send(email);
      }, next);
  }

  function createCloseioLead(req, res, next) {
    new CloseioLeadCreator(Implementation, req.body, opts)
      .perform()
      .then(() => {
        res.send({ msg: 'Close.io lead successfuly created.' });
      }, next);
  }

  this.perform = () => {
    if (integrationInfo) {
      app.get(
        path.generate(`${modelName}_closeio_leads/:leadId`, opts),
        auth.ensureAuthenticated, closeioLead,
      );

      app.get(
        path.generate(`${modelName}_closeio_leads/:leadId/emails`, opts),
        auth.ensureAuthenticated, closeioLeadEmails,
      );

      app.get(
        path.generate(`${modelName}_closeio_emails/:emailId`, opts),
        auth.ensureAuthenticated, closeioLeadEmail,
      );

      app.get(
        path.generate(`${modelName}/:recordId/lead`, opts),
        auth.ensureAuthenticated, customerLead,
      );

      app.post(
        path.generate(`${modelName}_closeio_leads`, opts),
        auth.ensureAuthenticated, createCloseioLead,
      );
    }
  };
};
