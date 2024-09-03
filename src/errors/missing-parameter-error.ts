export class MissingParameterError extends Error {
  constructor(message: string) {
    super();
    this.message = message;
  }
}
