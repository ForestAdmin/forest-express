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

winston.addColors(CONFIG.colors);

module.exports = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.metadata({ fillExcept: ['level', 'message'] }),
        winston.format.printf((info) => {
          let message = TITLE + info.message;

          if (info.metadata) {
            message += `\n${JSON.stringify(info.metadata, null, 2)}`;
          }

          if (info.stack) {
            message += `\n${info.stack}`;
          }

          return message;
        }),
        winston.format.colorize({ all: true }),
      ),
    }),
  ],
  levels: CONFIG.levels,
});
