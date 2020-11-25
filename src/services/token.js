const EXPIRATION_IN_DAYS = 14;
const PAST_DATE = new Date(0);
const REGEX_COOKIE_SESSION_TOKEN = /forest_session_token=([^;]*)/;

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

  // eslint-disable-next-line class-methods-use-this
  deleteToken() {
    return {
      expires: PAST_DATE,
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    };
  }

  /**
   * @param {string} cookies
   */
  // eslint-disable-next-line class-methods-use-this
  forestSessionToken(cookies) {
    return cookies.match(REGEX_COOKIE_SESSION_TOKEN);
  }
}

module.exports = TokenService;
