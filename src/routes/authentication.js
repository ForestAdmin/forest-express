const START_AUTHENTICATION_ROUTE = 'authentication';
const CALLBACK_AUTHENTICATION_ROUTE = 'authentication/callback';

const PUBLIC_ROUTES = [
  `/${START_AUTHENTICATION_ROUTE}`,
  `/${CALLBACK_AUTHENTICATION_ROUTE}`,
];

/**
 * @param {{
 *  authSecret: string;
 * }} options
 * @param {import('../utils/error-messages')} errorMessages
 */
function checkAuthSecret(options, errorMessages) {
  if (!options.authSecret) {
    throw new Error(errorMessages.CONFIGURATION.AUTH_SECRET_MISSING);
  }
}

/**
 * @param {import('express').Request} request
 * @param {import('../context/init').Context} context
 * @returns {number}
 */
function getAndCheckRenderingId(request, context) {
  if (!request.body || !request.body.renderingId) {
    throw new Error(context.errorMessages.SERVER_TRANSACTION.MISSING_RENDERING_ID);
  }

  const { renderingId } = request.body;

  if (!['string', 'number'].includes(typeof renderingId) || Number.isNaN(renderingId)) {
    throw new Error(context.errorMessages.SERVER_TRANSACTION.INVALID_RENDERING_ID);
  }

  return Number(renderingId);
}

/**
 * @param {import('../context/init').Context} context
 * @param {import('express').Request} request
 * @param {import('express').Response} response
 * @param {import('express').NextFunction} next
 */
async function startAuthentication(context, request, response, next) {
  try {
    const renderingId = getAndCheckRenderingId(request, context);

    const originalUrl = context.requestAnalyzerService.extractOriginalUrlWithoutQuery(request);
    response.json(
      context.authenticationService.startAuthentication(
        `${originalUrl}/callback`,
        { renderingId },
      ),
    );
  } catch (e) {
    next(e);
  }
}

/**
 * @param {import('../context/init').Context} context
 * @param {{envSecret: string, authSecret: string}} options
 * @param {import('express').Request} request
 * @param {import('express').Response} response
 * @param {import('express').NextFunction} next
 */
async function authenticationCallback({
  authenticationService,
  requestAnalyzerService,
}, options, request, response, next) {
  try {
    const originalUrl = requestAnalyzerService.extractOriginalUrlWithoutQuery(request);
    response.json(
      await authenticationService.verifyCodeAndGenerateToken(
        `${originalUrl}`,
        request.query,
        options,
      ),
    );
  } catch (e) {
    next(e);
  }
}

/**
 * @param {import('express').Application} app
 * @param {{
 *  authSecret: string;
 *  envSecret: string;
 * }} options
 * @param {import('../context/init').Context} context
 */
function initAuthenticationRoutes(
  app,
  options,
  context,
) {
  checkAuthSecret(options, context.errorMessages);

  app.post(
    context.pathService.generate(START_AUTHENTICATION_ROUTE, options),
    startAuthentication.bind(undefined, context),
  );
  app.get(
    context.pathService.generate(CALLBACK_AUTHENTICATION_ROUTE, options),
    authenticationCallback.bind(undefined, context, options),
  );
}

initAuthenticationRoutes.PUBLIC_ROUTES = PUBLIC_ROUTES;
module.exports = initAuthenticationRoutes;