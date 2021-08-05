const context = require('../../context');
const RecordSerializer = require('./record-serializer');

class RecordGetter extends RecordSerializer {
  constructor(model, user, params, { configStore } = context.inject()) {
    super(model, user, params, { configStore });

    if (!params?.timezone) {
      throw new Error(
        'Since v8.0.0 the RecordGetter\'s constructor has changed and requires access to the requesting user and query string.\n'
        + 'Please check the migration guide at https://docs.forestadmin.com/documentation/how-tos/maintain/upgrade-notes-sql-mongodb/upgrade-to-v8',
      );
    }
  }

  /**
   * Get a single record by primary key
   */
  get(recordId) {
    return new this.Implementation
      .ResourceGetter(this.model, { ...this.params, recordId }, this.user)
      .perform();
  }
}

module.exports = RecordGetter;
