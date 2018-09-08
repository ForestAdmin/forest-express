const _ = require('lodash');

exports.pushIntoApimap = function (apimap, collection) {
  var existingCollection = _.remove(apimap, function (currentCollection) {
    return currentCollection.name === collection.name;
  });

  if (existingCollection.length) {
    collection.actions = collection.actions.concat(existingCollection[0].actions);
  }

  apimap.push(collection);
};
