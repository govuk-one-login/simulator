export class UserInfoRequestError extends Error {
  public static readonly MISSING_TOKEN: UserInfoRequestError =
    new UserInfoRequestError({});

  public static readonly INVALID_TOKEN: UserInfoRequestError =
    new UserInfoRequestError({
      error_code: "invalid_token",
      error_description: "Invalid access token",
    });

  public static readonly INVALID_SCOPE: UserInfoRequestError =
    new UserInfoRequestError({
      error_code: "invalid_scope",
      error_description: "Invalid, unknown or malformed scope",
    });

  public static readonly INVALID_REQUEST: UserInfoRequestError =
    new UserInfoRequestError({
      error_code: "invalid_request",
      error_description: "Invalid request",
    });

  public static readonly HTTP_STATUS_CODE: number = 401;

  public error_code?: string;
  public error_description?: string;

  constructor(errorOptions: {
    error_code?: string;
    error_description?: string;
  }) {
    super(errorOptions.error_code + ": " + errorOptions.error_description);
    this.error_code = errorOptions.error_code;
    this.error_description = errorOptions.error_description;
  }

  public toAuthenticateHeader(): string {
    const arr = [];

    if (this.error_code != null) {
      arr.push(` error="${this.error_code}"`);
    }

    if (this.error_description != null) {
      arr.push(` error_description="${this.error_description}"`);
    }

    return `Bearer${arr.join(",")}`;
  }
}
