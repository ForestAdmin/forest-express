'use strict';
var P = require('bluebird');
var esprima = require('esprima');
var fs = require('fs');
var Pfs = P.promisifyAll(fs);
var logger = require('../services/logger');

exports.extractCodeSyntaxErrorInDirectoryFile = function (directory) {
  var hasError = false;
  var listFiles = [];

  function getDirectoryFiles(parentDirectory) {
    var files = fs.readdirSync(parentDirectory);
    files.forEach(function (file) {
      var path = parentDirectory + '/' + file;
      if (fs.statSync(path).isDirectory()){
        getDirectoryFiles(path);
      } else {
        listFiles.push(path);
      }
    });
  }

  if (fs.existsSync(directory)) {
    getDirectoryFiles(directory);
    listFiles.forEach(function (file) {
      var fileContent = Pfs.readFileSync(file);

      try {
        return esprima.parseModule(fileContent.toString(), { loc: true });
      } catch (error) {
        if (error) {
          hasError = true;
          logger.error('Forest customization failed due to a syntax error: ' +
            error.description + ' in ' + file + ':' + error.lineNumber);
        }
      }
    });
  }

  return new P(function(resolve) { return resolve(hasError); });
};
