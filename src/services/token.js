const EXPIRATION_IN_DAYS = 14;
const PAST_DATE = new Date(0);
class TokenService {
  /** @private @readonly @type {import('jsonwebtoken')} */
  jsonwebtoken;

  /**
   * @param {import("../context/init").Context} context
   */
  constructor(context) {
    this.jsonwebtoken = context.jsonwebtoken;
  }

  /** @returns {number} */
  // eslint-disable-next-line class-methods-use-this
  get expirationInDays() {
    return EXPIRATION_IN_DAYS;
  }

  /** @returns {number} */
  get expirationInSeconds() {
    return this.expirationInDays * 24 * 3600;
  }

  /**
   * @param {{
   *  id: number;
   *  email: string;
   *  first_name: string;
   *  last_name: string;
   *  teams: number[];
   * }} user
   * @param {string|number} renderingId
   * @param {{
   *  authSecret: string
   * }} options
   * @returns string
   */
  createToken(user, renderingId, { authSecret }) {
    return this.jsonwebtoken.sign({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      team: user.teams[0],
      renderingId,
    }, authSecret, {
      expiresIn: `${this.expirationInDays} days`,
    });
  }

  /**
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   */
  // eslint-disable-next-line class-methods-use-this
  deleteToken(request, response) {
    const token = request.headers.cookie.split('=')[1];
    return response.cookie('forest_session_token', token, {
      expires: PAST_DATE,
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
  }
}

module.exports = TokenService;
