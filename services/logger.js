'use strict';
var winston = require('winston');

var CONFIG = {
  levels: {
    error: 0,
    debug: 1,
    warn: 2,
    data: 3,
    info: 4,
    verbose: 5,
    silly: 6
  },
  colors: {
    error: 'red',
    debug: 'blue',
    warn: 'yellow',
    data: 'grey',
    info: 'green',
    verbose: 'cyan',
    silly: 'magenta'
  }
};

var TITLE = '[forest] 🌳🌳🌳  ';

module.exports = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      formatter: function (options) {
        var env = process.env;
        var message = winston.config.colorize(
          options.level, TITLE + options.message);

        if ( env.NODE_ENV === 'development' || env.FOREST_USE_CONSOLE ) {
          var level = options.level in console ? options.level : 'log'
          console[level](message);
          if ( options.meta && options.meta.stack ) {
            console[level](options.meta.stack);
          }

        } else {
          return message +
            (options.meta && options.meta.stack ? '\n' + options.meta.stack : '');
        }
      }
    })
  ],
  levels: CONFIG.levels,
  colors: CONFIG.colors
});
