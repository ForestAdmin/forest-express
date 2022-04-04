const { init } = require('@forestadmin/context');
const Stats = require('../../src/routes/stats');

describe('routes > stats', () => {
  describe('.get', () => {
    it('should return a value for objective chart', async () => {
      expect.assertions(1);

      init((context) => context);

      const app = {};
      const model = { name: 'book' };

      class FakeValueStatGetter {
        perform = jest.fn(async () => ({ value: { countCurrent: 5 } }))
      }

      const Implementation = {
        getModelName: jest.fn(() => 'books'),
        ValueStatGetter: FakeValueStatGetter,
      };

      const next = jest.fn();
      const req = {
        params: { recordId: '1' },
        query: { timezone: 'Europe/Paris' },
        user: { renderingId: 1 },
        body: { type: 'Objective' },
      };
      const res = {
        send: jest.fn(),
      };

      const subject = new Stats(app, model, Implementation);
      await subject.get(req, res, next);

      const resMockParameters = res.send.mock.calls[0][0];

      expect(resMockParameters.data.attributes.value.value).toStrictEqual(5);
    });
  });
});
