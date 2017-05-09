'use strict';
var P = require('bluebird');
var esprima = require('esprima');
var fs = P.promisifyAll(require('fs'));
var logger = require('../services/logger');

function extractSyntaxErrorInDirectoryFile(directorySmartImplementation){

  fs.readdirAsync(directorySmartImplementation)
  .map(function (filename) {
    var file = directorySmartImplementation + '/' + filename;
    var fileContent = fs.readFileSync(file);
    try {
        return esprima.parse(fileContent.toString(), { tolerant: true, loc: true });
  		} catch (errors) {
        if(errors){
          logger.warn('');
          logger.warn('WARNING in ' + file);
          logger.warn('Smart Collection build failed: SyntaxError: ' +
            errors.description + ' expected { (' + errors.lineNumber +
            ':' + errors.index +')');
            logger.warn('');
        }
  	}
  })
  .then(function () {
    return false;
  });
}

exports.extractSyntaxErrorInDirectoryFile = extractSyntaxErrorInDirectoryFile;
