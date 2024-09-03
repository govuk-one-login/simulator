export class AuthoriseRequestError extends Error {
  public errorDescription: string;
  public errorCode: string;
  public httpStatusCode: number;
  public redirectUri?: string;
  public state?: string | null;

  constructor(errorObject: {
    errorCode: string;
    errorDescription: string;
    httpStatusCode: 302;
    redirectUri: string;
    state: string | null;
  }) {
    super(`${errorObject.errorCode}: ${errorObject.errorDescription}`);
    this.errorCode = errorObject.errorCode;
    this.errorDescription = errorObject.errorDescription;
    this.httpStatusCode = errorObject.httpStatusCode;
    this.state = errorObject.state;
    this.redirectUri = errorObject.redirectUri;
  }
}
