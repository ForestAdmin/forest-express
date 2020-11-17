const ModelsManager = require('../../src/services/models-manager');

describe('services > models-manager', () => {
  describe('getModels', () => {
    const configStore = {
      lianaOptions: {
        connections: {
          db1: {
            models: {
              model1: {
                name: 'model1',
              },
              model2: {
                name: 'model2',
              },
            },
          },
        },
      },
      Implementation: {
        getModelName: jest.fn((model) => model.name),
      },
    };

    const modelsManager = new ModelsManager({ configStore });

    it('should return the model lists as an object using model name as a key', () => {
      expect.assertions(1);

      const models = modelsManager.getModels();
      expect(models).toMatchObject({
        model1: {
          name: 'model1',
        },
        model2: {
          name: 'model2',
        },
      });
    });

    it('should not recompute the model lists', () => {
      expect.assertions(1);

      const spy = jest.spyOn(modelsManager, '_generateModelList');

      modelsManager.getModels();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('when using includedModels', () => {
    it('should return only included models', () => {
      expect.assertions(1);
      const configStore = {
        lianaOptions: {
          includedModels: ['model1'],
          connections: {
            db1: {
              models: {
                model1: {
                  name: 'model1',
                },
                model2: {
                  name: 'model2',
                },
              },
            },
          },
        },
        Implementation: {
          getModelName: jest.fn((model) => model.name),
        },
      };

      const modelsManager = new ModelsManager({ configStore });

      const models = modelsManager.getModels();
      const expectedReturn = { model1: { name: 'model1' } };
      expect(models).toStrictEqual(expectedReturn);
    });
  });

  describe('when using excludedModels', () => {
    it('should return models that were not excluded', () => {
      expect.assertions(1);
      const configStore = {
        lianaOptions: {
          excludedModels: ['model1'],
          connections: {
            db1: {
              models: {
                model1: {
                  name: 'model1',
                },
                model2: {
                  name: 'model2',
                },
              },
            },
          },
        },
        Implementation: {
          getModelName: jest.fn((model) => model.name),
        },
      };

      const modelsManager = new ModelsManager({ configStore });

      const models = modelsManager.getModels();
      const expectedReturn = { model2: { name: 'model2' } };
      expect(models).toStrictEqual(expectedReturn);
    });
  });

  describe('when using includedModels and excludedModels', () => {
    it('should return only included models', () => {
      expect.assertions(1);
      const configStore = {
        lianaOptions: {
          includedModels: ['model1'],
          excludedModels: ['model1'],
          connections: {
            db1: {
              models: {
                model1: {
                  name: 'model1',
                },
                model2: {
                  name: 'model2',
                },
              },
            },
          },
        },
        Implementation: {
          getModelName: jest.fn((model) => model.name),
        },
      };

      const modelsManager = new ModelsManager({ configStore });

      const models = modelsManager.getModels();
      const expectedReturn = { model1: { name: 'model1' } };
      expect(models).toStrictEqual(expectedReturn);
    });
  });
});
