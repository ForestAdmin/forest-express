const _ = require('lodash');

const prettyPrint = (json, indentation = '') => {
  let result = '';

  if (_.isArray(json)) {
    result += '[';
    const isSmall = json.length < 3;
    const isPrimaryValue = json.length && !_.isArray(json[0]) && !_.isObject(json[0]);

    _.each(json, (item, index) => {
      if (index === 0 && isPrimaryValue && !isSmall) {
        result += `\n${indentation}  `;
      } else if (index > 0 && isPrimaryValue && !isSmall) {
        result += `,\n${indentation}  `;
      } else if (index > 0) {
        result += ', ';
      }

      result += prettyPrint(item, isPrimaryValue ? `${indentation}  ` : indentation);
    });

    if (isPrimaryValue && !isSmall) {
      result += `\n${indentation}`;
    }
    result += ']';
  } else if (_.isObject(json)) {
    result += '{\n';

    let isFirst = true;
    Object.keys(json).forEach((key) => {
      const value = json[key];
      if (!isFirst) {
        result += ',\n';
      } else {
        isFirst = false;
      }

      result += `${indentation}  "${key}": `;
      result += prettyPrint(value, `${indentation}  `);
    });

    result += `\n${indentation}}`;
  } else if (_.isNil(json)) {
    result += 'null';
  } else if (_.isString(json)) {
    result += `"${json.replace(/"/g, '\\"')}"`;
  } else {
    result += `${json}`;
  }

  return result;
};

exports.prettyPrint = prettyPrint;
