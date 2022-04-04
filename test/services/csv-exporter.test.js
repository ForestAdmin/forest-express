const { init, inject } = require('@forestadmin/context');
const CSVExporter = require('../../src/services/csv-exporter');
const Schemas = require('../../src/generators/schemas');

init((context) => context.addInstance('configStore', () => ({
  Implementation: {
    Flattener: undefined,
  },
})));

describe('services > csv-exporter', () => {
  const initialiseContext = () => {
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
        expect.assertions(1);

        initialiseContext();
        const { configStore } = inject();
        configStore.Implementation = {
          Flattener: {
            flattenRecordsForExport: jest.fn().mockReturnValue([{}]),
          },
        };

        const csvExporter = new CSVExporter(
          exportParams,
          fakeResponse,
          'cars',
          mockRecordsExporter,
        );

        await csvExporter.perform();

        expect(configStore.Implementation.Flattener.flattenRecordsForExport)
          .toHaveBeenNthCalledWith(1, 'cars', [{}]);
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
