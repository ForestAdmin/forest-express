'use strict';

function decorateForSearch(records, searchValue) {
  const matchFields = {};
  records.data.forEach((record, index) => {
    Object.entries(record.attributes).forEach(([attributeName, value]) => {
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
