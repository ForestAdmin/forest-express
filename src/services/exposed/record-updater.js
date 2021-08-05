const RecordSerializer = require('./record-serializer');

class RecordUpdater extends RecordSerializer {
  constructor(model, user, params) {
    super(model);
    this.user = user;
    this.params = params;

    if (!params?.timezone) {
      throw new Error(
        'Since v8.0.0 the RecordUpdater\'s constructor has changed and requires access to the requesting user and query string.\n'
        + 'Please check the migration guide at https://docs.forestadmin.com/documentation/how-tos/maintain/upgrade-notes-sql-mongodb/upgrade-to-v8',
      );
    }
  }

  /**
   * Update one record by id.
   * Fields which are not provided are not updated.
   */
  update(record, recordId) {
    return new this.Implementation
      .ResourceUpdater(this.model, { ...this.params, recordId }, record, this.user)
      .perform();
  }
}

module.exports = RecordUpdater;
