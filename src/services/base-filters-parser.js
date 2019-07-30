import _ from 'lodash';
import { InvalidFiltersFormatError } from './error';

// NOTICE: Parse the given filters into a valid JSON.
const parseFiltersString = (filtersString) => {
  try {
    return filtersString ? JSON.parse(filtersString) : null;
  } catch (error) {
    throw new InvalidFiltersFormatError('Invalid filters JSON format');
  }
};

// NOTICE: Apply the formatCondition function to a condition (leaf).
const parseCondition = (condition, formatCondition) => {
  if (_.isEmpty(condition)) { throw new InvalidFiltersFormatError('Empty condition in filter'); }

  return formatCondition(condition);
};

// NOTICE: Call the formatAggregation function on the node and propagate it to its childs or
//         call the parseCondition function on the node if the node is a leaf.
const parseAggregation = (node, formatAggregation, formatCondition) => {
  if (_.isEmpty(node)) { throw new InvalidFiltersFormatError('Empty condition in filter'); }
  if (!_.isObject(node)) { throw new InvalidFiltersFormatError('Filters cannot be a raw value'); }
  if (_.isArray(node)) { throw new InvalidFiltersFormatError('Filters cannot be a raw array'); }

  if (!node.aggregator) { return parseCondition(node, formatCondition); }

  const formatedConditions = [];

  if (!_.isArray(node.conditions)) {
    throw new InvalidFiltersFormatError('Filters\' conditions must be an array');
  }

  node.conditions.forEach(condition => formatedConditions
    .push(parseAggregation(condition, formatAggregation, formatCondition)));

  return formatAggregation(node.aggregator, formatedConditions);
};

// NOTICE: Recursively call the formatAggregation function on the nodes of the filters tree and
//         propagate the formatCondition function to the leaves.
const perform = (filtersString, formatAggregation, formatCondition) => {
  const filters = parseFiltersString(filtersString);

  if (!filters) { return null; }

  return parseAggregation(filters, formatAggregation, formatCondition);
};

const getConditionAssociation = (condition) => {
  const splittedField = condition.field.split(':');
  return splittedField.length > 1 ? splittedField[0] : null;
};

const aggregateAssociations = (_aggregator, conditionsAssociations) => {
  return _.flatten(conditionsAssociations);
};

// NOTICE: Recursively populate the associations names from the filters.
const getAssociations = (filtersString) => {
  const associations = perform(
    filtersString,
    aggregateAssociations,
    getConditionAssociation,
  );
  if (!_.isArray(associations)) { return [associations]; }
  return _.uniq(_.compact(associations));
};

module.exports = {
  perform,
  parseFiltersString,
  getAssociations,
};
