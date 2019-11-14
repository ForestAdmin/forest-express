const _ = require('lodash');

exports.pushIntoApimap = function (apimap, collection) {
  const existingCollection = _.remove(apimap, currentCollection => currentCollection.name === collection.name);

  if (existingCollection.length) {
    if (!collection.actions) {
      collection.actions = [];
    }
    collection.actions = collection.actions.concat(existingCollection[0].actions);
  }

  apimap.push(collection);
};
