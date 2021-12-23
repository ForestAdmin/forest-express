const context = require('../../src/context/');
const CSVExporter = require('../../src/services/csv-exporter');
const initContext = require('../../src/context/init');
const Schemas = require('../../src/generators/schemas');

context.init(initContext);
const { configStore } = context.inject();

describe('services > csv-exporter', () => {
  const initialiseContext = () => {
    configStore.Implementation = {
      Flattener: undefined,
    };
    Schemas.schemas.cars = {
      fields: [{
        field: '_id',
      }, {
        field: 'name',
      }],
    };
  };

  describe('handling records to export', () => {
    const fakeResponse = {
      setHeader: () => {},
      write: () => {},
      end: () => {},
    };
    const exportParams = {
      filename: 'cars',
      fields: {
        cars: '_id,name',
      },
      header: '_id,name',
    };
    const mockRecordsExporter = {
      perform: (exporter) => exporter([{}]),
    };

    describe('when implementation supports flatten fields feature', () => {
      it('should flatten records', async () => {
        expect.assertions(2);

        initialiseContext();

        configStore.Implementation = {
          Flattener: {
            flattenRecordsForExport: jest.fn().mockReturnValue([{}]),
          },
        };

        const spy = jest
          .spyOn(configStore.Implementation.Flattener, 'flattenRecordsForExport')
          .mockImplementation(() => [{}]);

        const csvExporter = new CSVExporter(
          exportParams,
          fakeResponse,
          'cars',
          mockRecordsExporter,
        );

        await csvExporter.perform();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith('cars', [{}]);
      });
    });

    describe('when implementation does not support flatten fields feature', () => {
      it('should not flatten records', async () => {
        expect.assertions(1);

        initialiseContext();

        const csvExporter = new CSVExporter(
          exportParams,
          fakeResponse,
          'cars',
          mockRecordsExporter,
        );

        await expect(csvExporter.perform()).toResolve();
      });
    });
  });
});
