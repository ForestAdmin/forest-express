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

    const request = {
      headers: {
        cookie: 'forest_session_token=my_value_token',
      },
    };

    const response = {
      cookie: jest.fn(),
    };

    const tokenService = new TokenService(context);

    return {
      tokenService,
      jsonwebtoken,
      request,
      response,
    };
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

  it('should update the expiration date of a token in the past', () => {
    expect.assertions(1);

    const { tokenService } = setup();
    const result = tokenService.deleteToken();

    expect(result).toStrictEqual({
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
  });
});
