const path = require('../services/path');
const auth = require('../services/auth');

function initScopeRoutes(app, { configStore, scopeManager, logger }) {
  app.post(
    path.generate('scope-cache-invalidation', configStore.lianaOptions),
    auth.ensureAuthenticated,
    (request, response) => {
      try {
        const { renderingId } = request.body;
        if (!renderingId) {
          logger.error('missing renderingId');
          return response.status(400).send();
        }

        scopeManager.invalidateScopeCache(renderingId);
        return response.status(200).send();
      } catch (error) {
        logger.error('Error during scope cache invalidation: ', error);
        return response.status(500).send();
      }
    },
  );
}

module.exports = initScopeRoutes;
