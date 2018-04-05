const moment = require('moment');
const uuidV1 = require('uuid/v1');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;

function MixpanelEventsSerializer(events, collectionName, meta, options) {
  events = events.map(function (event) {
    const specialPropertiesMap = {
      $city: 'city',
      $region: 'region',
      $timezone: 'timezone',
      $os: 'os',
      $os_version: 'osVersion',
      mp_country_code: 'country',
      time: 'date'
    };

    Object.keys(event.properties).forEach(function (prop) {
      if (specialPropertiesMap[prop]) {
        event[specialPropertiesMap[prop]] = event.properties[prop];
      } else {
        event[prop] = event.properties[prop];
      }

      delete event.properties[prop];
    });

    event.id = uuidV1();
    event.date = moment(parseInt(event.date, 10) * 1000).format('');

    return event;
  });

  const type = collectionName + '_mixpanel_events';
  const attrs = ['id', 'event', 'date', 'city', 'region', 'country', 'os', 'osVersion', 'browser'];

  if (options.integrations.mixpanel.customProperties) {
    attrs.push.apply(attrs, options.integrations.mixpanel.customProperties);
  }

  return new JSONAPISerializer(type, events, {
    attributes: attrs,
    keyForAttribute: function (key) { return key; },
    meta,
  });
}

module.exports = MixpanelEventsSerializer;
