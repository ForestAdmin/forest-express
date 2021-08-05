const RecordSerializer = require('./record-serializer');

class RecordCounter extends RecordSerializer {
  constructor(model, user, params) {
    super(model);
    this.user = user;
    this.params = params;

    if (!params?.timezone) {
      throw new Error(
        'Since v8.0.0 the RecordCounter\'s constructor has changed and requires access to the requesting user and query string.\n'
        + 'Please check the migration guide at https://docs.forestadmin.com/documentation/how-tos/maintain/upgrade-notes-sql-mongodb/upgrade-to-v8',
      );
    }
  }

  /**
   * Count records matching request provided in constructor.
   */
  count() {
    return new this.Implementation
      .ResourcesGetter(this.model, this.lianaOptions, this.params, this.user)
      .count();
  }
}

module.exports = RecordCounter;
