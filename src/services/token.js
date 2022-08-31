const EXPIRATION_IN_HOURS = 1;
const PAST_DATE = new Date(0);
const FOREST_SESSION_TOKEN = 'forest_session_token';
const REGEX_COOKIE_SESSION_TOKEN = new RegExp(`${FOREST_SESSION_TOKEN}=([^;]*)`);

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
  get expirationInHours() {
    return EXPIRATION_IN_HOURS;
  }

  /** @returns {number} */
  get expirationInSeconds() {
    return this.expirationInHours * 3600;
  }

  /** @returns {string} */
  // eslint-disable-next-line class-methods-use-this
  get forestCookieName() {
    return FOREST_SESSION_TOKEN;
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
      role: user.role,
      tags: user.tags,
      permissionLevel: user.permission_level,
      renderingId,
    }, authSecret, {
      expiresIn: `${this.expirationInHours} hours`,
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
  extractForestSessionToken(cookies) {
    const forestSession = cookies.match(REGEX_COOKIE_SESSION_TOKEN);
    if (forestSession && forestSession[1]) {
      return forestSession[1];
    }
    return null;
  }
}

module.exports = TokenService;
