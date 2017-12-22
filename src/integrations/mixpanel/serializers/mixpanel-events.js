'use strict';
/* jshint camelcase: false */
var moment = require('moment');
var uuidV1 = require('uuid/v1');
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

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

  var type = collectionName + '_mixpanel_events';

  return new JSONAPISerializer(type, events, {
    attributes: ['id', 'event', 'date', 'city', 'os', 'browser',
      'browserVersion'],
    keyForAttribute: function (key) { return key; },
    meta: meta
  });
}

module.exports = MixpanelEventsSerializer;
