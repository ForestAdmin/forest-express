const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const uuidV1 = require('uuid/v1');

function StatSerializer(stat) {
  stat.id = uuidV1();

  this.perform = () =>
    new JSONAPISerializer('stats', stat, {
      attributes: ['value', 'objective'],
      keyForAttribute: key => key,
    });
}

module.exports = StatSerializer;
