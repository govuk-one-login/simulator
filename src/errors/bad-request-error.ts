export class BadRequestError extends Error {
  constructor(errorDescription: string) {
    super();
    this.message = `Invalid Request: ${errorDescription}`;
  }
}
