const moment = require('moment');
const uuidV1 = require('uuid/v1');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;

function MixpanelEventsSerializer(events, collectionName, meta) {
  events = events.map(function (event) {
    event.id = uuidV1();
    event.date = moment(parseInt(event.properties.time, 10) * 1000).format('');
    event.city = event.properties.$city;
    event.os = event.properties.$os;
    event.browser = event.properties.$browser;
    event.browserVersion = event.properties.$browser_version;

    return event;
  });

  const type = `${collectionName}_mixpanel_events`;

  return new JSONAPISerializer(type, events, {
    attributes: ['id', 'event', 'date', 'city', 'os', 'browser',
      'browserVersion'],
    keyForAttribute: function (key) { return key; },
    meta,
  });
}

module.exports = MixpanelEventsSerializer;
