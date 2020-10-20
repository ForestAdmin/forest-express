const TokenService = require('../../src/services/token');

describe('token service', () => {
  function setup() {
    const jsonwebtoken = {
      sign: jest.fn(),
    };

    /** @type {*} */
    const context = {
      jsonwebtoken,
    };

    const tokenService = new TokenService(context);

    return { tokenService, jsonwebtoken };
  }

  it("should sign a token with user's data", () => {
    expect.assertions(2);

    const { jsonwebtoken, tokenService } = setup();

    jsonwebtoken.sign.mockReturnValue('THE TOKEN');

    const user = {
      id: 666,
      email: 'alice@forestadmin.com',
      first_name: 'Alice',
      last_name: 'Doe',
      teams: [1, 2, 4],
    };

    const result = tokenService.createToken(
      user,
      42,
      { authSecret: 'THIS IS SECRET' },
    );

    expect(result).toStrictEqual('THE TOKEN');
    expect(jsonwebtoken.sign).toHaveBeenCalledWith({
      id: 666,
      email: 'alice@forestadmin.com',
      firstName: 'Alice',
      lastName: 'Doe',
      team: 1,
      renderingId: 42,
    },
    'THIS IS SECRET',
    { expiresIn: '14 days' });
  });
});
