export class ParseTokenRequestError extends Error {
  constructor(message: string) {
    super();
    this.message = message;
  }
}
