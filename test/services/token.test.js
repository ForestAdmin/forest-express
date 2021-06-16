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

    const cookiesWithForestSessionToken = 'ajs_anonymous_id=%221d8dca9c-df5a-4c05-9bf7-0100df608603%22; _uc_referrer=direct; _ga=GA1.2.426771952.1606302064; _gid=GA1.2.263801298.1606302064; forest_session_token=myForestToken';

    const cookiesWithoutForestSessionToken = 'ajs_anonymous_id=%221d8dca9c-df5a-4c05-9bf7-0100df608603%22; _uc_referrer=direct; _ga=GA1.2.426771952.1606302064; _gid=GA1.2.263801298.1606302064';

    return {
      tokenService,
      jsonwebtoken,
      request,
      response,
      cookiesWithForestSessionToken,
      cookiesWithoutForestSessionToken,
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
      role: 'Test',
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
      role: 'Test',
      renderingId: 42,
    },
    'THIS IS SECRET',
    { expiresIn: '1 hours' });
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

  it('should return null when there is no forest session cookie', () => {
    expect.assertions(1);

    const { tokenService, cookiesWithoutForestSessionToken } = setup();
    const result = tokenService.extractForestSessionToken(cookiesWithoutForestSessionToken);

    expect(result).toBeNull();
  });

  it('should return the forest session cookie', () => {
    expect.assertions(1);

    const { tokenService, cookiesWithForestSessionToken } = setup();
    const result = tokenService.extractForestSessionToken(cookiesWithForestSessionToken);

    expect(result).toStrictEqual('myForestToken');
  });
});
