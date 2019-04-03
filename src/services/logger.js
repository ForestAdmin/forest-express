const winston = require('winston');

const CONFIG = {
  levels: {
    error: 0,
    debug: 1,
    warn: 2,
    data: 3,
    info: 4,
    verbose: 5,
    silly: 6,
  },
  colors: {
    error: 'red',
    debug: 'blue',
    warn: 'yellow',
    data: 'grey',
    info: 'green',
    verbose: 'cyan',
    silly: 'magenta',
  },
};

const TITLE = '[forest] 🌳🌳🌳  ';

module.exports = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      formatter: (options) => {
        let message = TITLE + options.message;

        if (options.meta && options.meta.stack) {
          message += `\n${options.meta.stack}`;
        }

        return winston.config.colorize(options.level, message);
      },
    }),
  ],
  levels: CONFIG.levels,
  colors: CONFIG.colors,
});
