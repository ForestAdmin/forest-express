const jwt = require('express-jwt');
const url = require('url');

const { getJWTConfiguration } = require('../config/jwt');
const auth = require('../services/auth');
const context = require('../context');
const initAuthenticationRoutes = require('../routes/authentication');

const PUBLIC_ROUTES = [
  '/',
  '/healthcheck',
  ...initAuthenticationRoutes.PUBLIC_ROUTES,
];

let jwtAuthenticator;

exports.initAuthenticator = () => {
  const {
    configStore,
    tokenService,
  } = context.inject();

  jwtAuthenticator = jwt(getJWTConfiguration({
    secret: configStore.lianaOptions.authSecret,
    getToken: (request) => {
      if (request.headers) {
        if (request.headers.authorization
          && request.headers.authorization.split(' ')[0] === 'Bearer') {
          return request.headers.authorization.split(' ')[1];
        }
        // NOTICE: Necessary for downloads authentication.
        if (request.headers.cookie) {
          const forestSessionToken = tokenService
            .extractForestSessionToken(request.headers.cookie);
          if (forestSessionToken) {
            return forestSessionToken;
          }
        }
      }
      return null;
    },
  }));

  return jwtAuthenticator;
};

/**
 * @param {import('express').Request} request
 * @param {import('express').Response} response
 * @param {import('express').NextFunction} next
 */
exports.ensureAuthenticated = (request, response, next) => {
  const parsedUrl = url.parse(request.originalUrl);
  const forestPublicRoutes = PUBLIC_ROUTES.map((route) => `/forest${route}`);

  if (forestPublicRoutes.includes(parsedUrl.pathname)) {
    next();
    return;
  }

  // console.log('authenticate', request, jwtAuthenticator)
  auth.authenticate(request, response, next, jwtAuthenticator);
};

exports.PUBLIC_ROUTES = PUBLIC_ROUTES;
