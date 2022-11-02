export default class UnprocessableError extends Error {
  public readonly status: number;

  constructor(message?: string) {
    super(message || 'Unprocessable');
    this.name = this.constructor.name;
    this.status = 422;
  }
}
