
// This file is a copy/paste of `utils/widgets.js` and a function from
// `services/environment-configurator.js` in forestadmin-server.
// The purpose is to transform the legacy `widget` from smart actions
// into `widgetEdit`, since it is required when using smart actions' hooks
// to avoid loosing widgets.

// This list contains every edit widget available.
const widgetEditList = [
  'address editor',
  'belongsto typeahead',
  'belongsto dropdown',
  'boolean editor',
  'checkboxes',
  'color editor',
  'date editor',
  'dropdown',
  'embedded document editor',
  'file picker',
  'json code editor',
  'input array',
  'multiple select',
  'number input',
  'point editor',
  'price editor',
  'radio button',
  'rich text',
  'text area editor',
  'text editor',
  'time input',
];

// This list convert old V1 widgets' names that have been changed.
// It creates a mapping between V1 widget name and its corresponding V2 edit widget name.
// This is only used to migrate edit widgets from smart actions using legacy V1 system.
const V1ToV2EditWidgetsMapping = {
  address: 'address editor',
  'belongsto select': 'belongsto dropdown',
  'color picker': 'color editor',
  'date picker': 'date editor',
  price: 'price editor',
  'JSON editor': 'json code editor',
  'rich text editor': 'rich text',
  'text area': 'text area editor',
  'text input': 'text editor',
};

/**
 * Convert V1 widgets from smart actions to V2 widgets.
 * V1 widgets still need to be supported as their usage in smart action is legacy.
 *
 * @param {*} field A smart action field
 */
function setFieldWidget(field) {
  field.widgetEdit = null;

  if (field.widget && !field.widgetEdit) {
    if (V1ToV2EditWidgetsMapping[field.widget]) {
      field.widgetEdit = { name: V1ToV2EditWidgetsMapping[field.widget], parameters: { } };
    } else if (widgetEditList.includes(field.widget)) {
      field.widgetEdit = { name: field.widget, parameters: { } };
    }
  }

  delete field.widget;
}

module.exports = {
  setFieldWidget,
};
