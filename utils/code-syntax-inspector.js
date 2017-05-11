'use strict';
var P = require('bluebird');
var esprima = require('esprima');
var path = require('path');
var fs = require('fs');
var Pfs = P.promisifyAll(fs);
var logger = require('../services/logger');

exports.extractCodeSyntaxErrorInDirectoryFile = function (modelsDir) {
  var hasError = false;

  if (fs.existsSync(modelsDir)) {
    return Pfs.readdirAsync(modelsDir)
      .map(function (filename) {
        var file = path.join(modelsDir, filename);
        var fileContent = Pfs.readFileSync(file);

        try {
          return esprima.parse(fileContent.toString(), { loc: true });
        } catch (error) {
          if (error) {
            hasError = true;
            logger.error('Forest customization failed due to a syntax error: ' +
              error.description + ' in ' + file + ':' + error.lineNumber + ':' +
              error.index);
          }
        }
      })
      .then(function () { return hasError; });
  } else {
    return hasError;
  }
};
