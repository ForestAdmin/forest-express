import ScopeManager from '../../src/services/scope-manager';

describe('services > ScopeManager', () => {
  const defaultDependencies = {
    configStore: {},
    forestServerRequester: {},
    moment: {},
    logger: {},
  };

  describe('getScopeForUser', () => {
    const defaultUser = {
      id: '1',
      email: 'mycroft@canner.com',
      firstName: 'Mycroft',
      lastName: 'Canner',
      team: 'humanist',
      renderingId: 334,
    };
    const lianaOptions = { envSecret: 'hush' };
    const defaultRenderingScopes = {
      myCollection: {
        scope: {
          filter: {
            aggregator: 'and',
            conditions: [
              {
                field: 'name',
                operator: 'equal',
                value: 'Thisbe',
              },
            ],
          },
          dynamicScopesValues: { },
        },
      },
    };
    const newRenderingScopes = {
      myCollection: {
        scope: {
          filter: {
            aggregator: 'and',
            conditions: [
              {
                field: 'name',
                operator: 'equal',
                value: 'Ockham',
              },
            ],
          },
          dynamicScopesValues: { },
        },
      },
    };

    describe('with bad inputs', () => {
      const scopeManager = new ScopeManager(defaultDependencies);

      describe('with a user having no renderingId', () => {
        it('should throw an error', async () => {
          expect.assertions(1);

          await expect(
            scopeManager.getScopeForUser({}, 'myCollection'),
          ).rejects.toStrictEqual(new Error('Missing required renderingId'));
        });
      });

      describe('without providing a collectionName', () => {
        it('should throw an error', async () => {
          expect.assertions(1);

          await expect(
            scopeManager.getScopeForUser(defaultUser),
          ).rejects.toStrictEqual(new Error('Missing required collectionName'));
        });
      });
    });

    describe('when accessing the rendering scopes for the first time', () => {
      it('should retrieve and return the collection scope filters', async () => {
        expect.assertions(3);

        const configStore = { lianaOptions };
        const forestServerRequester = {
          perform: jest.fn().mockReturnValue(defaultRenderingScopes),
        };
        const moment = jest.fn();

        const scopeManager = new ScopeManager({
          ...defaultDependencies, configStore, forestServerRequester, moment,
        });

        const scopes = await scopeManager.getScopeForUser(defaultUser, 'myCollection');

        expect(forestServerRequester.perform).toHaveBeenCalledTimes(1);
        expect(forestServerRequester.perform).toHaveBeenCalledWith(
          '/liana/scopes', lianaOptions.envSecret, { renderingId: defaultUser.renderingId },
        );
        expect(scopes).toStrictEqual(defaultRenderingScopes.myCollection.scope.filter);
      });
    });

    describe('when calling twice the scopes from the same rendering', () => {
      describe('before the cache expiration', () => {
        const configStore = { lianaOptions };
        const forestServerRequester = { perform: jest.fn() };
        const forestServerRequesterPerformSpy = jest.spyOn(forestServerRequester, 'perform').mockReturnValue(defaultRenderingScopes);

        // fake 1mn diff between the two calls
        const momentInstance = { diff: jest.fn().mockReturnValue(60) };
        const moment = jest.fn().mockReturnValue(momentInstance);

        const scopeManager = new ScopeManager({
          ...defaultDependencies, configStore, forestServerRequester, moment,
        });

        it('should retrieve and return the scopes on first call', async () => {
          expect.assertions(3);

          forestServerRequesterPerformSpy.mockClear();

          const scopes = await scopeManager.getScopeForUser(defaultUser, 'myCollection');

          expect(forestServerRequesterPerformSpy).toHaveBeenCalledTimes(1);
          expect(forestServerRequesterPerformSpy).toHaveBeenCalledWith(
            '/liana/scopes', lianaOptions.envSecret, { renderingId: defaultUser.renderingId },
          );
          expect(scopes).toStrictEqual(defaultRenderingScopes.myCollection.scope.filter);
        });

        it('should not refetch the scopes and return the cached value on second call', async () => {
          expect.assertions(2);

          forestServerRequesterPerformSpy.mockClear();
          forestServerRequesterPerformSpy.mockReturnValue(newRenderingScopes);

          const scopes = await scopeManager.getScopeForUser(defaultUser, 'myCollection');

          expect(forestServerRequesterPerformSpy).not.toHaveBeenCalled();
          expect(scopes).toStrictEqual(defaultRenderingScopes.myCollection.scope.filter);
        });
      });

      describe('after the cache expiration', () => {
        const configStore = { lianaOptions };
        const forestServerRequester = { perform: jest.fn() };

        // fake 10mns diff between the two calls
        const momentInstance = { diff: jest.fn().mockReturnValue(600) };
        const moment = jest.fn().mockReturnValue(momentInstance);
        const forestServerRequesterPerformSpy = jest.spyOn(forestServerRequester, 'perform').mockReturnValue(defaultRenderingScopes);

        const scopeManager = new ScopeManager({
          ...defaultDependencies, configStore, forestServerRequester, moment,
        });

        it('should retrieve and return the scopes on first call', async () => {
          expect.assertions(3);

          forestServerRequesterPerformSpy.mockClear();

          const scopes = await scopeManager.getScopeForUser(defaultUser, 'myCollection');

          expect(forestServerRequesterPerformSpy).toHaveBeenCalledTimes(1);
          expect(forestServerRequesterPerformSpy).toHaveBeenCalledWith(
            '/liana/scopes', lianaOptions.envSecret, { renderingId: defaultUser.renderingId },
          );
          expect(scopes).toStrictEqual(defaultRenderingScopes.myCollection.scope.filter);
        });

        it('should refetch the scopes on second call but still return the cached value', async () => {
          expect.assertions(3);

          forestServerRequesterPerformSpy.mockClear();
          forestServerRequesterPerformSpy.mockReturnValue(newRenderingScopes);

          const scopes = await scopeManager.getScopeForUser(defaultUser, 'myCollection');

          expect(forestServerRequesterPerformSpy).toHaveBeenCalledTimes(1);
          expect(forestServerRequesterPerformSpy).toHaveBeenCalledWith(
            '/liana/scopes', lianaOptions.envSecret, { renderingId: defaultUser.renderingId },
          );
          expect(scopes).toStrictEqual(defaultRenderingScopes.myCollection.scope.filter);
        });
      });
    });

    describe('when calling three times the scopes after expiration', () => {
      const configStore = { lianaOptions };
      const forestServerRequester = { perform: jest.fn() };
      const forestServerRequesterPerformSpy = jest.spyOn(forestServerRequester, 'perform').mockReturnValue(defaultRenderingScopes);

      // fake 10mn diff between the two calls
      const momentInstance = { diff: jest.fn() };
      const momentInstanceSpy = jest.spyOn(momentInstance, 'diff').mockReturnValue(600);
      const moment = jest.fn().mockReturnValue(momentInstance);

      const scopeManager = new ScopeManager({
        ...defaultDependencies, configStore, forestServerRequester, moment,
      });

      it('should retrieve and return the scopes on first call', async () => {
        expect.assertions(3);

        momentInstanceSpy.mockClear();
        forestServerRequesterPerformSpy.mockClear();

        const scopes = await scopeManager.getScopeForUser(defaultUser, 'myCollection');

        expect(forestServerRequesterPerformSpy).toHaveBeenCalledTimes(1);
        expect(forestServerRequesterPerformSpy).toHaveBeenCalledWith(
          '/liana/scopes', lianaOptions.envSecret, { renderingId: defaultUser.renderingId },
        );
        expect(scopes).toStrictEqual(defaultRenderingScopes.myCollection.scope.filter);
      });

      it('should refetch the scopes on second call but still return the cached value', async () => {
        expect.assertions(3);

        momentInstanceSpy.mockClear();
        momentInstanceSpy.mockReturnValue(600);
        forestServerRequesterPerformSpy.mockClear();
        forestServerRequesterPerformSpy.mockReturnValue(newRenderingScopes);

        const scopes = await scopeManager.getScopeForUser(defaultUser, 'myCollection');

        expect(forestServerRequesterPerformSpy).toHaveBeenCalledTimes(1);
        expect(forestServerRequesterPerformSpy).toHaveBeenCalledWith(
          '/liana/scopes', lianaOptions.envSecret, { renderingId: defaultUser.renderingId },
        );
        expect(scopes).toStrictEqual(defaultRenderingScopes.myCollection.scope.filter);
      });


      it('should not refetch the scopes on third call and return the cached value (which was changed during second call)', async () => {
        expect.assertions(2);

        momentInstanceSpy.mockClear();
        // act as if the third call was close to the second one
        momentInstanceSpy.mockReturnValue(60);
        forestServerRequesterPerformSpy.mockClear();
        forestServerRequesterPerformSpy.mockReturnValue(newRenderingScopes);

        const scopes = await scopeManager.getScopeForUser(defaultUser, 'myCollection');

        expect(forestServerRequesterPerformSpy).not.toHaveBeenCalled();
        expect(scopes).toStrictEqual(newRenderingScopes.myCollection.scope.filter);
      });
    });

    describe('when no scopes on collection', () => {
      it('should return null', async () => {
        expect.assertions(3);

        const configStore = { lianaOptions };
        const forestServerRequester = {
          perform: jest.fn().mockReturnValue(defaultRenderingScopes),
        };
        const moment = jest.fn();

        const scopeManager = new ScopeManager({
          ...defaultDependencies, configStore, forestServerRequester, moment,
        });

        const scopes = await scopeManager.getScopeForUser(defaultUser, 'myOtherCollection');

        expect(forestServerRequester.perform).toHaveBeenCalledTimes(1);
        expect(forestServerRequester.perform).toHaveBeenCalledWith(
          '/liana/scopes', lianaOptions.envSecret, { renderingId: defaultUser.renderingId },
        );
        expect(scopes).toBeNull();
      });
    });

    describe('with dynamic values on scopes', () => {
      it('should retrieve and return the collection scope filters with dynamic values replaced', async () => {
        expect.assertions(3);

        const renderingScopesWithDynamicValues = {
          myCollection: {
            scope: {
              filter: {
                aggregator: 'and',
                conditions: [
                  {
                    field: 'type',
                    operator: 'equal',
                    value: '$currentUser.tags.title',
                  },
                ],
              },
              dynamicScopesValues: {
                users: {
                  1: {
                    '$currentUser.tags.title': 'production',
                  },
                },
              },
            },
          },
        };
        const configStore = { lianaOptions };
        const forestServerRequester = {
          perform: jest.fn().mockReturnValue(renderingScopesWithDynamicValues),
        };
        const moment = jest.fn();

        const scopeManager = new ScopeManager({
          ...defaultDependencies, configStore, forestServerRequester, moment,
        });

        const scopes = await scopeManager.getScopeForUser(defaultUser, 'myCollection');

        expect(forestServerRequester.perform).toHaveBeenCalledTimes(1);
        expect(forestServerRequester.perform).toHaveBeenCalledWith(
          '/liana/scopes', lianaOptions.envSecret, { renderingId: defaultUser.renderingId },
        );
        expect(scopes).toStrictEqual({
          aggregator: 'and',
          conditions: [
            {
              field: 'type',
              operator: 'equal',
              value: 'production',
            },
          ],
        });
      });
    });
  });
});
