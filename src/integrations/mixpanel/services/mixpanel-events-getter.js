const moment = require('moment');
const logger = require('../../../services/logger');

function MixpanelEventsGetter(Implementation, params, options, integrationInfo) {
  const MixpanelExport = options.integrations.mixpanel.mixpanel;
  const panel = new MixpanelExport({
    'api_key': options.integrations.mixpanel.apiKey,
    'api_secret': options.integrations.mixpanel.apiSecret
  });

  this.perform = function () {
    const collectionFieldName = integrationInfo.field;
    const collectionModel = integrationInfo.collection;

    return Implementation.Mixpanel.getUser(collectionModel, params.recordId)
      .then(function (user) {
        const script = `function main() {
          return People().filter(function (user) {
            return user.properties.$email == '${user[collectionFieldName]}';
          });
        }`;
        const fromDate = moment().subtract(6, 'months');
        const toDate = moment();

        return panel
          .get('jql', {
            script
          })
          .then(function (result) {
            if (!result || !result[0]) { return { results: { events: [] } }; }

            return panel
              .get('stream/query', {
                from_date: fromDate.format('YYYY-MM-DD'),
                to_date: toDate.format('YYYY-MM-DD'),
                distinct_ids: [result[0].distinct_id],
                limit: 100
              });
          })
          .then(function (result) {
            if (result.error) {
              logger.error('Cannot retrieve mixpanel events: ', result.error);
              return [];
            }

            return result.results.events.reverse();
          });
      });
  };
}

module.exports = MixpanelEventsGetter;
