const _ = require('lodash');

const INTEGRATION_NAME = 'mixpanel';

exports.createCollections = function (Implementation, apimap, collectionAndFieldName, options) {
  const model = Implementation.getModels()[collectionAndFieldName.split('.')[0]];
  const modelName = Implementation.getModelName(model);
  const collectionDisplayName = _.capitalize(modelName);

  const fields = [
    { field: 'id', type: 'String', isFilterable: false },
    { field: 'event', type: 'String', isFilterable: false },
    { field: 'date', type: 'Date', isFilterable: false },
    { field: 'city', type: 'String', isFilterable: false },
    { field: 'region', type: 'String', isFilterable: false },
    { field: 'country', type: 'String', isFilterable: false },
    { field: 'timezone', type: 'String', isFilterable: false },
    { field: 'os', type: 'String', isFilterable: false },
    { field: 'osVersion', type: 'String', isFilterable: false },
    { field: 'browser', type: 'String', isFilterable: false },
    { field: 'browserVersion', type: 'String', isFilterable: false }
  ];

  if (options.integrations.mixpanel.customProperties) {
    fields.push.apply(fields, options.integrations.mixpanel.customProperties.map(
      function (prop) {
        return {
          field: prop,
          type: 'String',
          isFilterable: false
        };
      }));
  }

  apimap.push({
    name: modelName + '_mixpanel_events',
    // TODO: Remove nameOld attribute once the lianas versions older than 2.0.0 are minority.
    nameOld: Implementation.getModelNameOld(model) + '_mixpanel_events',
    displayName: collectionDisplayName + ' Events',
    icon: 'mixpanel',
    integration: INTEGRATION_NAME,
    isVirtual: true,
    isReadOnly: true,
    onlyForRelationships: true,
    paginationType: 'cursor',
    fields,
  });
};

exports.createFields = function (implementation, model, schemaFields) {
  schemaFields.push({
    field: 'mixpanel_last_events',
    displayName: 'Last events',
    type: ['String'],
    reference: implementation.getModelName(model) + '_mixpanel_events.id',
    column: null,
    isFilterable: false,
    integration: INTEGRATION_NAME,
  });
};
