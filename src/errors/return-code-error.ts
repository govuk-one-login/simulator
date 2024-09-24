export class ReturnCodeError extends Error {
  public redirectUri?: string;

  constructor(message: string, redirectUri: string) {
    super();
    this.message = message;
    this.redirectUri = redirectUri;
  }
}
