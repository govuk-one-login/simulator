export class ParseAuthRequestError extends Error {
  public clientId?: string;
  public redirectUri?: string;

  constructor(message: string, clientId?: string, redirectUri?: string) {
    super();
    this.message = message;
    this.clientId = clientId;
    this.redirectUri = redirectUri;
  }
}
