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
      await context.authenticationService.startAuthentication(
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
  tokenService,
  jsonwebtoken,
}, options, request, response, next) {
  try {
    const originalUrl = requestAnalyzerService.extractOriginalUrlWithoutQuery(request);
    const token = await authenticationService.verifyCodeAndGenerateToken(
      `${originalUrl}`,
      request.query,
      options,
    );

    // Cookies with secure=true & sameSite:'none' will only work
    // on localhost or https
    // These are the only 2 supported situations for agents, that's
    // why the token is not returned inside the body
    response.cookie(
      'forest_session_token',
      token,
      {
        httpOnly: true,
        secure: true,
        maxAge: tokenService.expirationInSeconds,
        sameSite: 'none',
      },
    );
    response.status(200);
    // The token is sent decoded, because we don't want to share the whole, signed token
    // that is used to authenticate people
    // but the token itself contains interesting values, such as its expiration date
    response.send(jsonwebtoken.decode(token));
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
