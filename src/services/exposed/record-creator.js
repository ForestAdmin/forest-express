const context = require('../../context');
const RecordSerializer = require('./record-serializer');

class RecordCreator extends RecordSerializer {
  constructor(model, user, params, { configStore } = context.inject()) {
    super(model, user, params, { configStore });

    if (!params?.timezone) {
      throw new Error(
        'Since v8.0.0 the RecordCreator\'s constructor has changed and requires access to the requesting user and query string.\n'
        + 'Please check the migration guide at https://docs.forestadmin.com/documentation/how-tos/maintain/upgrade-notes-sql-mongodb/upgrade-to-v8',
      );
    }
  }

  /**
   * Create a new record
   */
  create(record) {
    return new this.Implementation
      .ResourceCreator(this.model, this.params, record, this.user)
      .perform();
  }

  /**
   * Deserialize records.
   *
   * Unless otherwise specified this method deserializes relationships and omits null attributes
   * which is desired with records that come from creation forms.
   */
  deserialize(body, withRelationships = true, omitNullAttributes = true) {
    return super.deserialize(body, withRelationships, omitNullAttributes);
  }
}

module.exports = RecordCreator;
