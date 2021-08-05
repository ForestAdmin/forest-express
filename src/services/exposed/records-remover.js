const RecordSerializer = require('./record-serializer');

class RecordsRemover extends RecordSerializer {
  constructor(model, user, params) {
    super(model);
    this.user = user;
    this.params = params;

    if (!params?.timezone) {
      throw new Error(
        'Since v8.0.0 the RecordsRemover\'s constructor has changed and requires access to the requesting user and query string.\n'
        + 'Please check the migration guide at https://docs.forestadmin.com/documentation/how-tos/maintain/upgrade-notes-sql-mongodb/upgrade-to-v8',
      );
    }
  }

  /**
   * Remove records by ids
   */
  remove(ids) {
    return new this.Implementation
      .ResourcesRemover(this.model, this.params, ids, this.user)
      .perform();
  }
}

module.exports = RecordsRemover;
