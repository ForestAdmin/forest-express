'use strict';
var JSONAPISerializer = require('jsonapi-serializer').Serializer;
var uuidV1 = require('uuid/v1');

function StatSerializer(stat) {
  stat.id = uuidV1();

  this.perform = function () {
    return new JSONAPISerializer('stats', stat, {
      attributes: ['value', 'current', 'objective'],
      keyForAttribute: function (key) { return key; }
    });
  };
}

module.exports = StatSerializer;
