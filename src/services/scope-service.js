const context = require('../context');

class ScopeService {
  constructor({ permissionsGetter, configStore, forestServerRequester } = context.inject()) {
    this.permissionsGetter = permissionsGetter;
    this.configStore = configStore;
    this.forestServerRequester = forestServerRequester;
    this.scopes = {};
  }

  get environmentSecret() {
    return this.configStore.lianaOptions.envSecret;
  }

  async getScopes(renderingId) {
    const queryParams = { renderingId };

    const scopes = await this.forestServerRequester.perform('/liana/scopes', this.environmentSecret, queryParams);
    console.log('scopes', scopes);
    return scopes;
    // return this.forestServerRequester
    //   .perform('/liana/scopes', this.environmentSecret, queryParams)
    //   .then((responseBody) => {
    //     this.isRolesACLActivated = responseBody.meta
    //       ? responseBody.meta.rolesACLActivated
    //       : false;

    //     if (!responseBody.data) return null;

    //     // NOTICE: Addtional permissions - live queries, stats parameters
    //     this._setStatsPermissions(responseBody.stats, { environmentId });

    //     if (renderingOnly) {
    //       return responseBody.data.renderings
    //         ? this._setRenderingPermissions(
    //           renderingId, responseBody.data.renderings[renderingId], { environmentId },
    //         )
    //         : null;
    //     }
    //     return this._setPermissions(renderingId, responseBody.data, { environmentId });
    //   })
    //   .catch((error) => Promise.reject(new this.VError(error, 'Permissions error')));
  }
}

module.exports = ScopeService;
