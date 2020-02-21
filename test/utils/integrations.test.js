const { pushIntoApimap } = require('../../src/utils/integrations');

// NOTICE: The `pushIntoApimap` function mutates the original `apimap` and reorders the list.
//         This behavior is a bit unexpected and should be fixed in a near future.
describe('utils › integrations › pushIntoApimap', () => {
  it('should append new collections', () => {
    expect.assertions(1);
    const apimap = [{ name: 'users' }];
    const collection = { name: 'projects' };

    const expected = [{ name: 'users' }, { name: 'projects' }];
    pushIntoApimap(apimap, collection);
    expect(apimap).toStrictEqual(expected);
  });

  it('should merge existing collections and actions', () => {
    expect.assertions(1);
    const apimap = [
      { name: 'users', actions: ['send-invoice'] },
      { name: 'projects', actions: ['mark-as-live'] },
    ];
    const collection = { name: 'users', actions: ['my-new-action'] };

    const expected = [
      { name: 'projects', actions: ['mark-as-live'] },
      { name: 'users', actions: ['my-new-action', 'send-invoice'] },
    ];
    pushIntoApimap(apimap, collection);
    expect(apimap).toStrictEqual(expected);
  });
});
