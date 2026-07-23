const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const { v1: uuidV1 } = require('uuid');

function StatSerializer(stat) {
  stat.id = uuidV1();

  this.perform = () =>
    new JSONAPISerializer('stats', stat, {
      attributes: ['value', 'objective'],
      keyForAttribute: (key) => key,
    });
}

module.exports = StatSerializer;
