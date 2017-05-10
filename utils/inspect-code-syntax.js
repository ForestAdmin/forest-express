'use strict';
var P = require('bluebird');
var esprima = require('esprima');
var path = require('path');
var fs = P.promisifyAll(require('fs'));
var logger = require('../services/logger');

exports.extractCodeSyntaxErrorInDirectoryFile = function(modelsDir) {
  fs.readdirAsync(modelsDir)
  .map(function (filename) {
    var file = path.join(modelsDir, filename);
    var fileContent = fs.readFileSync(file);
    try {
      return esprima.parse(fileContent.toString(),
        { tolerant: true, loc: true });
  	} catch (errors) {
      if (errors) {
        logger.error('ERROR in ' + file);
        logger.error('Smart Collection build failed: SyntaxError: ' +
          errors.description + ' expected { (' + errors.lineNumber +
          ':' + errors.index +')');
      }
  	}
  })
  .then(function () {
    return false;
  });
}
