const { inject } = require('@forestadmin/context');
const _ = require('lodash');
const { pushIntoApimap } = require('../../utils/integrations');

const INTEGRATION_NAME = 'mixpanel';

exports.createCollections = (Implementation, apimap, collectionAndFieldName, options) => {
  const { modelsManager } = inject();
  const model = modelsManager.getModels()[collectionAndFieldName.split('.')[0]];
  const modelName = Implementation.getModelName(model);
  const collectionDisplayName = _.capitalize(modelName);

  const fields = [{
    field: 'id',
    type: 'String',
    isVirtual: true,
    isFilterable: false,
    isSortable: false,
  }, {
    field: 'event',
    type: 'String',
    isVirtual: true,
    isFilterable: false,
    isSortable: false,
  }, {
    field: 'date',
    type: 'Date',
    isVirtual: true,
    isFilterable: false,
    isSortable: false,
  }, {
    field: 'city',
    type: 'String',
    isVirtual: true,
    isFilterable: false,
    isSortable: false,
  }, {
    field: 'region',
    type: 'String',
    isVirtual: true,
    isFilterable: false,
    isSortable: false,
  }, {
    field: 'country',
    type: 'String',
    isVirtual: true,
    isFilterable: false,
    isSortable: false,
  }, {
    field: 'timezone',
    type: 'String',
    isVirtual: true,
    isFilterable: false,
    isSortable: false,
  }, {
    field: 'os',
    type: 'String',
    isVirtual: true,
    isFilterable: false,
    isSortable: false,
  }, {
    field: 'osVersion',
    type: 'String',
    isVirtual: true,
    isFilterable: false,
    isSortable: false,
  }, {
    field: 'browser',
    type: 'String',
    isVirtual: true,
    isFilterable: false,
    isSortable: false,
  }, {
    field: 'browserVersion',
    type: 'String',
    isVirtual: true,
    isFilterable: false,
    isSortable: false,
  }];

  if (options.integrations.mixpanel.customProperties) {
    // eslint-disable-next-line prefer-spread
    fields.push.apply(
      fields,
      options.integrations.mixpanel.customProperties.map((propertyName) => ({
        field: propertyName,
        type: 'String',
        isVirtual: true,
        isFilterable: false,
        isSortable: false,
      })),
    );
  }

  pushIntoApimap(apimap, {
    name: `${modelName}_mixpanel_events`,
    displayName: `${collectionDisplayName} Events`,
    icon: 'mixpanel',
    isVirtual: true,
    integration: INTEGRATION_NAME,
    isReadOnly: true,
    onlyForRelationships: true,
    paginationType: 'cursor',
    fields,
  });
};

exports.createFields = (implementation, model, schemaFields) => {
  schemaFields.push({
    field: 'mixpanel_last_events',
    displayName: 'Last events',
    type: ['String'],
    reference: `${implementation.getModelName(model)}_mixpanel_events.id`,
    column: null,
    integration: INTEGRATION_NAME,
  });
};
