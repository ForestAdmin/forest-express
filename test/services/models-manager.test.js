const ModelsManager = require('../../src/services/models-manager');

describe('services > models-manager', () => {
  describe('getModels', () => {
    const configStore = {
      Implementation: {
        getModels: jest.fn(() => ({
          model1: {
            name: 'model1',
          },
          model2: {
            name: 'model2',
          },
        })),
        getModelName: jest.fn((model) => model.name),
      },
    };

    const modelsManager = new ModelsManager({ configStore });

    it('should return model lists', () => {
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

  describe('getModelArray', () => {
    it('should return models as array', () => {
      expect.assertions(1);
      const configStore = {
        Implementation: {
          getModels: jest.fn(() => ({
            model1: {
              name: 'model1',
            },
            model2: {
              name: 'model2',
            },
          })),
          getModelName: jest.fn((model) => model.name),
        },
      };

      const modelsManager = new ModelsManager({ configStore });

      const models = modelsManager.getModelArray();
      const expectedReturn = [{ name: 'model1', modelName: 'model1' }, { name: 'model2', modelName: 'model2' }];
      expect(models).toStrictEqual(expectedReturn);
    });
  });
});
