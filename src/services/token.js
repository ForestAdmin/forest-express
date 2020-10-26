class TokenService {
  /** @private @readonly @type {import('jsonwebtoken')} */
  jsonwebtoken;

  /**
   * @param {import("../context/init").Context} context
   */
  constructor(context) {
    this.jsonwebtoken = context.jsonwebtoken;
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
      expiresIn: '14 days',
    });
  }
}

module.exports = TokenService;
