const normalizeQueryFields = require('../../src/middlewares/query-fields-normalizer');

function run(query) {
  const request = { query };
  const next = jest.fn();
  normalizeQueryFields(request, {}, next);
  return { request, next };
}

describe('middlewares > query-fields-normalizer', () => {
  it('joins array field values into a comma-separated string', () => {
    const { request, next } = run({ fields: { dailySpecials: ['dayOfWeek', 'restaurantId'] } });

    expect(request.query.fields).toStrictEqual({ dailySpecials: 'dayOfWeek,restaurantId' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('leaves comma-separated string values untouched', () => {
    const { request } = run({ fields: { book: 'id,title', author: 'name' } });

    expect(request.query.fields).toStrictEqual({ book: 'id,title', author: 'name' });
  });

  it('normalizes only array values within a mixed fields object', () => {
    const { request } = run({ fields: { book: 'id,title', specials: ['a', 'b'] } });

    expect(request.query.fields).toStrictEqual({ book: 'id,title', specials: 'a,b' });
  });

  it('does nothing when there is no fields param', () => {
    const { request, next } = run({ search: 'foo' });

    expect(request.query).toStrictEqual({ search: 'foo' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does nothing when query is empty', () => {
    const { next } = run({});

    expect(next).toHaveBeenCalledTimes(1);
  });
});
