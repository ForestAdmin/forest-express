'use strict';

function decorateForSearch(records, searchValue) {
  records = records.map((record) => record.get({ plain: true }));
  const matchFields = {};
  records.forEach((record, index) => {
    Object.entries(record).forEach(([attributeName, value]) => {
      if (value) {
        value = value.toString();
        const match = value.match(new RegExp(searchValue, 'i'));
        if (match) {
          if (!matchFields[index]) {
            matchFields[index] = {
              id: record.id,
              search: [],
            };
          }
          matchFields[index]['search'].push(attributeName);
        }
      }
    });
  });

  return matchFields;
}

exports.decorateForSearch = decorateForSearch;
