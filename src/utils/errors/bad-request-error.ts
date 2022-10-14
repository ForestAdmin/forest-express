export default class BadRequestError extends Error {
  public readonly status: number;

  constructor(message?: string) {
    super(message || 'Bad Request');
    this.name = this.constructor.name;
    this.status = 400;
  }
}
