const _ = require('lodash');

class ApimapFieldsFormater {
  constructor({ logger }) {
    this.logger = logger;
  }

  formatFieldsByCollectionName(fields, collectionName) {
    const fieldsValid = _.filter(fields, (field) => {
      if (_.isUndefined(field.field) || _.isNull(field.field)) {
        this.logger.warn(`Bad Smart Field declaration in "${collectionName}" collection: missing "field" attribute.`);
        return false;
      }
      return true;
    });

    return _.map(fieldsValid, (field) => {
      field.isVirtual = true;
      field.isFilterable = field.isFilterable || false;
      field.isSortable = field.isSortable || false;
      field.isReadOnly = !field.set;

      return field;
    });
  }
}

module.exports = ApimapFieldsFormater;
