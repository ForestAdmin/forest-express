
const P = require('bluebird');
const esprima = require('esprima');
const fs = require('fs');

const Pfs = P.promisifyAll(fs);
const logger = require('../services/logger');

exports.extractCodeSyntaxErrorInDirectoryFile = function (directory) {
  let hasError = false;
  const listFiles = [];

  function getDirectoryFiles(parentDirectory) {
    const files = fs.readdirSync(parentDirectory);
    files.forEach((file) => {
      const path = `${parentDirectory}/${file}`;
      if (fs.statSync(path).isDirectory()) {
        getDirectoryFiles(path);
      } else {
        listFiles.push(path);
      }
    });
  }

  if (fs.existsSync(directory)) {
    getDirectoryFiles(directory);
    listFiles.forEach((file) => {
      const fileContent = Pfs.readFileSync(file);

      try {
        return esprima.parseModule(fileContent.toString(), { loc: true });
      } catch (error) {
        if (error) {
          hasError = true;
          logger.error(`Forest customization failed due to a syntax error: ${
            error.description} in ${file}:${error.lineNumber}`);
        }
      }
    });
  }

  return new P((resolve => resolve(hasError)));
};
