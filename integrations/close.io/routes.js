'use strict';
var _ = require('lodash');
var auth = require('../../services/auth');
var IntegrationInformationsGetter = require('../../services/integration-informations-getter');
var CloseioLeadsGetter = require('./services/closeio-leads-getter');
var CloseioLeadGetter = require('./services/closeio-lead-getter');
var CloseioLeadEmailsGetter = require('./services/closeio-lead-emails-getter');
var CloseioLeadEmailGetter = require('./services/closeio-lead-email-getter');
var CloseioCustomerLeadGetter = require('./services/closeio-customer-lead-getter');
var CloseioLeadCreator = require('./services/closeio-lead-creator');
var CloseioLeadsSerializer = require('./serializers/closeio-leads');
var CloseioLeadEmailsSerializer = require('./serializers/closeio-lead-emails');

module.exports = function (app, model, Implementation, opts) {
  var modelName = Implementation.getModelName(model);
  var integrationInfo;

  if (opts.integrations && opts.integrations.closeio) {
    integrationInfo = new IntegrationInformationsGetter(modelName,
         Implementation, opts.integrations.closeio).perform();
  }

  if (integrationInfo) {
    var integrationValues = integrationInfo.split('.');
    integrationInfo = {
      collection: Implementation.getModels()[integrationValues[0]],
      field: integrationValues[1]
    };
  }

  function closeioLeads(req, res, next) {
    new CloseioLeadsGetter(Implementation, _.extend(req.query,
      req.params), opts, integrationInfo)
      .perform()
      .then(function (results) {
        var count = results[0];
        var leads = results[1];

        return new CloseioLeadsSerializer(leads, modelName, {
          count: count
        });
      })
      .then(function (leads) {
        res.send(leads);
      }, next);
  }

  function closeioLead(req, res, next) {
    new CloseioLeadGetter(Implementation, _.extend(req.query, req.params), opts)
      .perform()
      .then(function (lead) {
        return new CloseioLeadsSerializer(lead, modelName);
      })
      .then(function (lead) {
        res.send(lead);
      }, next);
  }

  function closeioLeadEmails(req, res, next) {
    new CloseioLeadEmailsGetter(Implementation,
      _.extend(req.query, req.params), opts)
      .perform()
      .then(function (results) {
        var count = results[0];
        var emails = results[1];

        return new CloseioLeadEmailsSerializer(emails, modelName, {
          count: count
        });
      })
      .then(function (emails) {
        res.send(emails);
      }, next);
  }

  function customerLead(req, res, next) {
    new CloseioCustomerLeadGetter(Implementation, _.extend(req.query,
      req.params), opts)
      .perform()
      .then(function (lead) {
        if (!lead) { throw { status: 404, message: 'not_found' }; }
        return new CloseioLeadsSerializer(lead, modelName);
      })
      .then(function (lead) {
        res.send(lead);
      }, next);
  }

  function closeioLeadEmail(req, res, next) {
    new CloseioLeadEmailGetter(Implementation, _.extend(req.query,
      req.params), opts)
      .perform()
      .then(function (email) {
        return new CloseioLeadEmailsSerializer(email, modelName);
      })
      .then(function (email) {
        res.send(email);
      }, next);
  }

  function createCloseioLead(req, res, next) {
    new CloseioLeadCreator(Implementation, req.body, opts)
      .perform()
      .then(function () {
        res.send({ msg: 'Close.io lead successfuly created.' });
      }, next);
  }

  this.perform = function () {
    app.get('/forest/' + modelName + '_closeio_leads',
      auth.ensureAuthenticated, closeioLeads);

    app.get('/forest/' + modelName + '_closeio_leads/:leadId',
      auth.ensureAuthenticated, closeioLead);

    app.get('/forest/' + modelName + '_closeio_leads/:leadId/emails',
      auth.ensureAuthenticated, closeioLeadEmails);

    app.get('/forest/' + modelName + '_closeio_emails/:emailId',
      auth.ensureAuthenticated, closeioLeadEmail);

    app.get('/forest/' + modelName + '/:recordId/closeio_lead',
      auth.ensureAuthenticated, customerLead);

    app.post('/forest/' + modelName + '_closeio_leads',
      auth.ensureAuthenticated, createCloseioLead);
  };
};
