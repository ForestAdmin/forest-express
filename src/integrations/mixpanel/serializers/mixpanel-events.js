const moment = require('moment');
const uuidV1 = require('uuid/v1');
const JSONAPISerializer = require('jsonapi-serializer').Serializer;

function serializeMixpanelEvents(events, collectionName, meta, options) {
  events = events.map((event) => {
    const MAP_PROPERTIES = {
      $city: 'city',
      $region: 'region',
      $timezone: 'timezone',
      $os: 'os',
      $os_version: 'osVersion',
      mp_country_code: 'country',
      time: 'date',
    };

    Object.keys(event.properties).forEach((propertyName) => {
      if (MAP_PROPERTIES[propertyName]) {
        event[MAP_PROPERTIES[propertyName]] = event.properties[propertyName];
      } else {
        event[propertyName] = event.properties[propertyName];
      }

      delete event.properties[propertyName];
    });

    event.id = uuidV1();
    event.date = moment(parseInt(event.date, 10) * 1000).format('');

    return event;
  });

  const type = `${collectionName}_mixpanel_events`;
  const attributes = ['id', 'event', 'date', 'city', 'region', 'country', 'os', 'osVersion',
    'browser'];

  if (options.integrations.mixpanel.customProperties) {
    // eslint-disable-next-line prefer-spread
    attributes.push.apply(attributes, options.integrations.mixpanel.customProperties);
  }

  return new JSONAPISerializer(type, events, {
    attributes,
    keyForAttribute(key) { return key; },
    meta,
  });
}

module.exports = serializeMixpanelEvents;
