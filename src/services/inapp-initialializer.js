const cors = require('cors');
const requireAll = require('require-all');

const { ensureAuthenticated, PUBLIC_ROUTES } = require('../middlewares/authentication');
const context = require('../context');

const inAppInit = async (app, models, appDir, init) => {
  const {
    errorHandler,
    forestUrl,
    fs,
    logger,
    path,
  } = context.inject();

  let allowedOrigins = [/\.forestadmin\.com$/, /localhost:\d{4}$/];

  if (process.env.CORS_ORIGINS) {
    allowedOrigins = allowedOrigins.concat(process.env.CORS_ORIGINS.split(','));
  }

  const corsConfig = {
    origin: allowedOrigins,
    allowedHeaders: ['Authorization', 'X-Requested-With', 'Content-Type'],
    maxAge: 86400, // NOTICE: 1 day
    credentials: true,
  };

  app.use('/forest/authentication', cors({
    ...corsConfig,
    // The null origin is sent by browsers for redirected AJAX calls
    // we need to support this in authentication routes because OIDC
    // redirects to the callback route
    origin: corsConfig.origin.concat('null'),
  }));
  app.use('/forest', cors(corsConfig));

  app.use('/forest', (request, response, next) => {
    if (PUBLIC_ROUTES.includes(request.url)) {
      return next();
    }
    return ensureAuthenticated(request, response, next);
  });

  const forestMiddlewareDirectory = path.join(appDir, 'forest', 'middlewares');
  if (fs.existsSync(forestMiddlewareDirectory)) {
    requireAll({
      dirname: forestMiddlewareDirectory,
      recursive: true,
      resolve: (Module) => Module(app),
    });
  }

  const forestRouteDirectory = path.join(appDir, 'forest', 'routes');
  if (fs.existsSync(forestRouteDirectory)) {
    requireAll({
      dirname: forestRouteDirectory,
      recursive: true,
      resolve: (Module) => app.use('/forest', Module),
    });
  }

  const configDir = path.join(appDir, 'forest', 'forest');
  app.use(await init({
    configDir,
    envSecret: process.env.FOREST_ENV_SECRET,
    authSecret: process.env.FOREST_AUTH_SECRET,
    objectMapping: models.Sequelize,
    connections: { default: models.sequelize },
  }));

  app.use('/forest', errorHandler());

  logger.info(`Your Forest Admin panel is available here: ${forestUrl}/projects`);
};

module.exports = {
  inAppInit,
};
