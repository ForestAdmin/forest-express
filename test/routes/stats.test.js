const { init } = require('@forestadmin/context');
const Stats = require('../../src/routes/stats');

const chartHandler = {
  getChartWithContextInjected: jest.fn(),
  getQueryForChart: jest.fn(),
};
init((context) => context.addInstance('chartHandler', chartHandler));

describe('routes > stats', () => {
  describe('.get', () => {
    it('should return a value for objective chart', async () => {
      const app = {};
      const model = { name: 'book' };

      const performMock = jest.fn().mockResolvedValue(({ value: { countCurrent: 5 } }));
      const FakeValueStatGetter = jest.fn().mockImplementation(() => ({ perform: performMock }));

      const Implementation = {
        getModelName: jest.fn(() => 'books'),
        ValueStatGetter: FakeValueStatGetter,
      };

      const chart = { type: 'Objective', objective: 1000 };
      chartHandler.getChartWithContextInjected.mockResolvedValue(chart);

      const next = jest.fn();
      const req = {
        params: { recordId: '1' },
        query: { timezone: 'Europe/Paris' },
        user: { renderingId: 1, id: 10 },
        body: { type: 'Objective', contextVariables: { test: 'me' } },
      };
      const res = {
        send: jest.fn(),
      };
      const expectedParams = {
        timezone: 'Europe/Paris',
        contextVariables: { test: 'me' },
        ...chart,
      };

      const subject = new Stats(app, model, Implementation);
      await subject.get(req, res, next);

      expect(chartHandler.getChartWithContextInjected).toHaveBeenCalledOnceWith({
        userId: 10,
        renderingId: 1,
        chartRequest: req.body,
      });
      expect(FakeValueStatGetter).toHaveBeenCalledOnceWith(model, expectedParams, {}, req.user);
      expect(performMock).toHaveBeenCalledOnceWith();

      const resMockParameters = res.send.mock.calls[0][0];
      expect(resMockParameters.data.attributes.value.value).toBe(5);
    });
  });

  describe('.getWithLiveQuery', () => {
    it('should return a value for objective chart', async () => {
      const app = {};
      const model = { name: 'book' };

      const performMock = jest.fn().mockResolvedValue(([{ value: 5, objective: 10 }]));
      const FakeQueryStatGetter = jest.fn().mockImplementation(() => ({ perform: performMock }));

      const Implementation = {
        getModelName: jest.fn(() => 'books'),
        QueryStatGetter: FakeQueryStatGetter,
      };

      const chart = { query: 'SELECT something as value', contextVariables: { power: 'fly' } };
      chartHandler.getQueryForChart.mockResolvedValue(chart);

      const next = jest.fn();
      const req = {
        params: { recordId: '1' },
        query: { timezone: 'Europe/Paris' },
        user: { renderingId: 1, id: 10 },
        body: { type: 'Objective', contextVariables: { test: 'me', power: 'fake' } },
      };
      const res = {
        send: jest.fn(),
      };
      const expectedParams = {
        type: 'Objective',
        ...chart,
        contextVariables: {
          ...req.body.contextVariables,
          ...chart.contextVariables,
        },
      };

      const subject = new Stats(app, model, Implementation);
      await subject.getWithLiveQuery(req, res, next);

      expect(chartHandler.getQueryForChart).toHaveBeenCalledOnceWith({
        userId: 10,
        renderingId: 1,
        chartRequest: req.body,
      });
      expect(FakeQueryStatGetter).toHaveBeenCalledOnceWith(expectedParams, {});
      expect(performMock).toHaveBeenCalledOnceWith();

      expect(res.send).toHaveBeenCalledOnceWith({
        data: {
          id: expect.toBeString(),
          type: 'stats',
          attributes: {
            value: {
              value: 5,
              objective: 10,
            },
          },
        },
      });
    });
  });
});
