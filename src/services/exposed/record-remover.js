const context = require('../../context');
const RecordSerializer = require('./record-serializer');

class RecordRemover extends RecordSerializer {
  constructor(model, user, params, { configStore } = context.inject()) {
    super(model, user, params, { configStore });

    if (!params?.timezone) {
      throw new Error(
        'Since v8.0.0 the RecordRemover\'s constructor has changed and requires access to the requesting user and query string.\n'
        + 'Please check the migration guide at https://docs.forestadmin.com/documentation/how-tos/maintain/upgrade-notes-sql-mongodb/upgrade-to-v8',
      );
    }
  }

  /**
   * Remove one record by primary key
   */
  remove(recordId) {
    return new this.Implementation
      .ResourceRemover(this.model, { ...this.params, recordId }, this.user)
      .perform();
  }
}

module.exports = RecordRemover;
