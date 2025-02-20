const { inject } = require('@forestadmin/context');

const START_AUTHENTICATION_ROUTE = 'authentication';
const CALLBACK_AUTHENTICATION_ROUTE = 'authentication/callback';
const LOGOUT_ROUTE = 'authentication/logout';

const PUBLIC_ROUTES = [
  `/${START_AUTHENTICATION_ROUTE}`,
  `/${CALLBACK_AUTHENTICATION_ROUTE}`,
  `/${LOGOUT_ROUTE}`,
];

/**
 * @param {import('../context/init').Context} context
 * @param {string} applicationUrl
 * @returns {string}
 */
function getCallbackUrl(context, applicationUrl) {
  return context.joinUrl(applicationUrl, `/forest/${CALLBACK_AUTHENTICATION_ROUTE}`);
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
    const applicationUrl = context.configStore.lianaOptions.applicationUrl
      || context.env.APPLICATION_URL;

    const result = await context.authenticationService.startAuthentication(
      getCallbackUrl(context, applicationUrl),
      { renderingId },
    );

    response.status(200).send(result);
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
    const applicationUrl = context.configStore.lianaOptions.applicationUrl
      || context.env.APPLICATION_URL;

    const token = await context.authenticationService.verifyCodeAndGenerateToken(
      getCallbackUrl(context, applicationUrl),
      request.query,
      options,
    );

    response.status(200);
    response.send({
      token,
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
  // Not needed anymore, as we don't use cookies
  response.status(204).send();
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
    startAuthentication.bind(undefined, inject()),
  );
  app.get(
    context.pathService.generate(CALLBACK_AUTHENTICATION_ROUTE, options),
    authenticationCallback.bind(undefined, inject(), options),
  );
  app.post(
    context.pathService.generate(LOGOUT_ROUTE, options),
    logout.bind(undefined, inject()),
  );
}

initAuthenticationRoutes.PUBLIC_ROUTES = PUBLIC_ROUTES;
initAuthenticationRoutes.CALLBACK_ROUTE = CALLBACK_AUTHENTICATION_ROUTE;
module.exports = initAuthenticationRoutes;
