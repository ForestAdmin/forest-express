const errorMessages = require('../utils/error-messages');
const errorUtils = require('../utils/error');
const stringUtils = require('../utils/string');
const joinUrl = require('../utils/join-url');
const { setFieldWidget } = require('../utils/widgets');

module.exports = (context) =>
  context.addInstance('errorMessages', () => errorMessages)
    .addInstance('stringUtils', () => stringUtils)
    .addInstance('errorUtils', () => errorUtils)
    .addInstance('setFieldWidget', () => setFieldWidget)
    .addInstance('joinUrl', () => joinUrl);
