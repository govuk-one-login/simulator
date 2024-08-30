export class ParseRequestError extends Error {
  constructor(message: string) {
    super();
    this.message = message;
  }
}
