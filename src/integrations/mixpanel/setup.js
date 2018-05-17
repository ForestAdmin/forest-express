'use strict';
/* jshint camelcase: false */
var _ = require('lodash');
var moment = require('moment');

var INTEGRATION_NAME = 'mixpanel';

exports.createCollections = function (Implementation, apimap, schema, opts) {
  var collectionName = opts.integrations.mixpanel.mapping.split('.')[0];
  var collectionDisplayName = _.capitalize(collectionName);

  apimap.push({
    name: collectionName + '_mixpanel_events',
    displayName: collectionDisplayName + ' Events',
    icon: 'mixpanel',
    isVirtual: true,
    integration: INTEGRATION_NAME,
    isReadOnly: true,
    onlyForRelationships: true,
    fields: [
      { field: 'event', type: 'String', isFilterable: false },
      { field: 'date', type: 'String', isFilterable: false },
      { field: 'city', type: 'String', isFilterable: false },
      { field: 'os', type: 'String', isFilterable: false },
      { field: 'browser', type: 'String', isFilterable: false },
      { field: 'browserVersion', type: 'String', isFilterable: false },
      { field: 'id', type: 'String', isFilterable: false }
    ]
  });
};

exports.createSegments = function (Implementation, model, schema, opts) {
  if (!schema.segments) { schema.segments = []; }
  var mappingSplit = opts.integrations.mixpanel.mapping.split('.');
  var collectionName = mappingSplit[0];
  var fieldName = mappingSplit[1];

  schema.segments.push({
    id: collectionName + '.mixpanel_active',
    name: 'Active this week',
    where: function (params) {
      var MixpanelExport = opts.integrations.mixpanel.mixpanel;
      var panel = new MixpanelExport({
        'api_key': opts.integrations.mixpanel.apiKey,
        'api_secret': opts.integrations.mixpanel.apiSecret
      });

      // NOTICE: Handle timezones
      var offsetHours = 0;
      if (params && params.timezone) {
        var offsetClient = parseInt(params.timezone, 10);
        var offsetServer = moment().utcOffset() / 60;
        offsetHours = offsetServer - offsetClient;
      }

      // NOTICE: Active the current week
      var weekBeginning = moment().startOf('week').add(offsetHours, 'h').unix();

      return panel
        .engage({
          selector: '(datetime(' + weekBeginning +
            ') < properties["$last_seen"])'
        })
        .then(function (data) {
          var where = {};
          var results = data.results || [];
          where[fieldName] = {
            $in: results.map(function (result) {
              return result.$distinct_id;
            })
          };

          return where;
        });
    }
  });
};

exports.createFields = function (implementation, model, schemaFields) {
  schemaFields.push({
    field: 'mixpanel_events_this_week',
    displayName: 'Events this week',
    type: ['String'],
    reference: implementation.getModelName(model) + '_mixpanel_events.id',
    column: null,
    isFilterable: false,
    integration: INTEGRATION_NAME
  });
};
