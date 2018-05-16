'use strict';

exports.getSearchMatchFields = function (searchString, records) {
  records = records.map((record) => record.get({ plain: true }));
  const matchFields = {};
  records.forEach((record, index) => {
    Object.entries(record).forEach(([key, value]) => {
      if (value) {
        value = value.toString();
        const match = value.match(new RegExp(searchString, 'i'));
        if (match) {
          if (!matchFields[index]) {
            matchFields[index] = { 'id': record.id };
            matchFields[index]['search'] = [];
          }
          matchFields[index]['search'].push(key);
        }
      }
    });
  });

  return matchFields;
};
