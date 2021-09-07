import _ from 'lodash';
import { InvalidFiltersFormat } from '../utils/error';
import { getField, isSmartField } from '../utils/schema';

// NOTICE: Parse the given filters into a valid JSON.
const parseFiltersString = (filtersString) => {
  try {
    return filtersString ? JSON.parse(filtersString) : null;
  } catch (error) {
    throw new InvalidFiltersFormat('Invalid filters JSON format');
  }
};

// NOTICE: Apply the formatCondition function to a condition (leaf).
const parseCondition = async (condition, formatCondition, modelSchema) => {
  if (_.isEmpty(condition)) { throw new InvalidFiltersFormat('Empty condition in filter'); }
  if (!_.isObject(condition)) { throw new InvalidFiltersFormat('Condition cannot be a raw value'); }
  if (_.isArray(condition)) { throw new InvalidFiltersFormat('Filters cannot be a raw array'); }
  if (!_.isString(condition.field) || !_.isString(condition.operator)
      || _.isUndefined(condition.value)) {
    throw new InvalidFiltersFormat('Invalid condition format');
  }

  if (modelSchema && isSmartField(modelSchema, condition.field)) {
    const fieldFound = getField(modelSchema, condition.field);

    if (!fieldFound.filter) throw new Error(`"filter" method missing on smart field "${fieldFound.field}"`);

    const where = await formatCondition(condition, true);
    const formattedCondition = await fieldFound
      .filter({
        where,
        condition,
      });
    if (!formattedCondition) throw new Error(`"filter" method on smart field "${fieldFound.field}" must return a condition`);
    return formattedCondition;
  }

  return formatCondition(condition);
};

// NOTICE: Call the formatAggregation function on the node and propagate it to its childs or
//         call the parseCondition function on the node if the node is a leaf.
const parseAggregation = async (node, formatAggregation, formatCondition, modelSchema) => {
  if (_.isEmpty(node)) { throw new InvalidFiltersFormat('Empty condition in filter'); }
  if (!_.isObject(node)) { throw new InvalidFiltersFormat('Filters cannot be a raw value'); }
  if (_.isArray(node)) { throw new InvalidFiltersFormat('Filters cannot be a raw array'); }

  if (!node.aggregator) { return parseCondition(node, formatCondition, modelSchema); }


  if (!_.isArray(node.conditions)) {
    throw new InvalidFiltersFormat('Filters\' conditions must be an array');
  }

  const promises = [];
  node.conditions.forEach((condition) =>
    promises.push(parseAggregation(condition, formatAggregation, formatCondition, modelSchema)));

  const formatedConditions = await Promise.all(promises);

  return formatAggregation(node.aggregator, formatedConditions);
};

// NOTICE: Recursively call the formatAggregation function on the nodes of the filters tree and
//         propagate the formatCondition function to the leaves.
const perform = async (filtersString, formatAggregation, formatCondition, modelSchema) => {
  const filters = parseFiltersString(filtersString);

  if (!filters) { return null; }

  return parseAggregation(filters, formatAggregation, formatCondition, modelSchema);
};

const getConditionAssociation = (condition) => {
  const splittedField = condition.field.split(':');
  return splittedField.length > 1 ? splittedField[0] : null;
};

const aggregateAssociations = (_aggregator, conditionsAssociations) =>
  _.flatten(conditionsAssociations);

// NOTICE: Recursively populate the associations names from the filters.
const getAssociations = async (filtersString) => {
  const associations = await perform(
    filtersString,
    aggregateAssociations,
    getConditionAssociation,
  );
  if (!_.isArray(associations)) { return associations ? [associations] : []; }
  return _.uniq(_.compact(associations));
};

module.exports = {
  perform,
  parseFiltersString,
  getAssociations,
  parseCondition,
};
