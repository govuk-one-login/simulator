export class TokenRequestError extends Error {
  public errorCode: string;
  public errorDescription: string;
  public httpStatusCode: number;

  constructor(errorOptions: {
    errorCode: string;
    errorDescription: string;
    httpStatusCode: 400 | 401 | 403 | 500 | 502;
  }) {
    super();
    this.message = `${errorOptions.errorCode}: ${errorOptions.errorDescription}`;
    this.errorCode = errorOptions.errorCode;
    this.errorDescription = errorOptions.errorDescription;
    this.httpStatusCode = errorOptions.httpStatusCode;
  }
}
