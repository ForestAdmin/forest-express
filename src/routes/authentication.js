const START_AUTHENTICATION_ROUTE = 'authentication';
const CALLBACK_AUTHENTICATION_ROUTE = 'authentication/callback';
const LOGOUT_ROUTE = 'authentication/logout';

const REGEX_COOKIE_SESSION_TOKEN = /forest_session_token=([^;]*)/;

const PUBLIC_ROUTES = [
  `/${START_AUTHENTICATION_ROUTE}`,
  `/${CALLBACK_AUTHENTICATION_ROUTE}`,
  `/${LOGOUT_ROUTE}`,
];

function getCallbackUrl(applicationUrl) {
  const url = new URL(`/forest/${CALLBACK_AUTHENTICATION_ROUTE}`, applicationUrl);

  return url.toString();
}

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
 * @param {Error} error
 * @param {import('express').Response} response
 * @param {import('express').NextFunction} next
 */
function handleError(context, error, response, next) {
  if (error instanceof context.openIdClient.errors.OPError) {
    switch (error.error) {
      case 'access_denied':
      case 'invalid_client':
        response.status(403).send(error);
        break;
      default:
        response.status(400).send(error);
    }

    return;
  }

  if (error instanceof context.openIdClient.errors.RPError) {
    response.status(400).send(error);
    return;
  }

  next(error);
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

    const result = await context.authenticationService.startAuthentication(
      getCallbackUrl(context.env.APPLICATION_URL),
      { renderingId },
    );

    response.redirect(result.authorizationUrl);
  } catch (e) {
    handleError(context, e, response, next);
  }
}

/**
 * @param {import('../context/init').Context} context
 * @param {{envSecret: string, authSecret: string}} options
 * @param {import('express').Request} request
 * @param {import('express').Response} response
 * @param {import('express').NextFunction} next
 */
async function authenticationCallback(context, options, request, response, next) {
  try {
    const token = await context.authenticationService.verifyCodeAndGenerateToken(
      getCallbackUrl(context.env.APPLICATION_URL),
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
        maxAge: context.tokenService.expirationInSeconds,
        sameSite: 'none',
      },
    );
    response.status(200);
    // The token is sent decoded, because we don't want to share the whole, signed token
    // that is used to authenticate people
    // but the token itself contains interesting values, such as its expiration date
    response.send({
      ...(!context.env.APPLICATION_URL.startsWith('https://')
        ? { token }
        : {}
      ),
      tokenData: context.jsonwebtoken.decode(token),
    });
  } catch (e) {
    handleError(context, e, response, next);
  }
}

/**
 * @param {import('../context/init').Context} context
 * @param {import('express').Request} request
 * @param {import('express').Response} response
 */
async function logout(context, request, response) {
  const cookies = request.headers.cookie;
  const isLocalhost = request.headers.host.match(/localhost:([0-9]+)$/);

  if (isLocalhost) {
    response.status(204).send();
  } else if (cookies) {
    const deletedToken = context.tokenService.deleteToken();
    const match = cookies.match(REGEX_COOKIE_SESSION_TOKEN);

    if (match && match[1]) {
      const forestToken = match[1];
      response.cookie('forest_session_token', forestToken, deletedToken);
      response.status(204).send();
    } else {
      response.status(400).send();
    }
  } else {
    response.status(400).send();
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
  app.post(
    context.pathService.generate(LOGOUT_ROUTE, options),
    logout.bind(undefined, context),
  );
}

initAuthenticationRoutes.PUBLIC_ROUTES = PUBLIC_ROUTES;
initAuthenticationRoutes.CALLBACK_ROUTE = CALLBACK_AUTHENTICATION_ROUTE;
module.exports = initAuthenticationRoutes;
