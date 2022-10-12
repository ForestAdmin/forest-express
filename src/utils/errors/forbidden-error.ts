export default class ForbiddenError extends Error {
  public readonly status: number;

  constructor(message?: string) {
    super(message || 'Forbidden');
    this.name = this.constructor.name;
    this.status = 403;
  }
}
