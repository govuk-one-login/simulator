const privateKeyJwtValidatorMock = jest.fn();
const clientSecretValidatorMock = jest.fn();

jest.mock(
  "../../components/token/client-authentication/validate-private-key-jwt",
  () => ({
    validatePrivateKeyJwt: privateKeyJwtValidatorMock,
  })
);

jest.mock(
  "../../components/token/client-authentication/validate-client-secret-post",
  () => ({
    validateClientSecretPost: clientSecretValidatorMock,
  })
);

import { Config } from "../../config";
import { TokenRequestError } from "../../errors/token-request-error";
import { parseTokenRequest } from "../parse-token-request";

const config = Config.getInstance();

describe("parseTokenRequest tests", () => {
  it("throws an invalid_request error for no grant_type", async () => {
    await expect(
      parseTokenRequest(
        {
          code: "1234",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion:
            "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIiLCJpc3MiOiIiLCJhdWQiOiIiLCJqdGkiOiIifQ.r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI",
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request is missing grant_type parameter",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_request error when the grant_type is not authorization_code", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "not_authorization_code",
          code: "1234",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion:
            "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIiLCJpc3MiOiIiLCJhdWQiOiIiLCJqdGkiOiIifQ.r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI",
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "unsupported_grant_type",
        errorDescription: "Unsupported grant type",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_request error when no redirect_uri is included", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          code: "1234",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion:
            "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIiLCJpc3MiOiIiLCJhdWQiOiIiLCJqdGkiOiIifQ.r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI",
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request is missing redirect_uri parameter",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_request error when no code is included", async () => {
    await expect(
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion:
            "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIiLCJpc3MiOiIiLCJhdWQiOiIiLCJqdGkiOiIifQ.r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI",
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request is missing code parameter",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_request error when an empty string code is included", async () => {
    await expect(
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          redirect_uri: "https://example.com/authentication-callback/",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion:
            "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIiLCJpc3MiOiIiLCJhdWQiOiIiLCJqdGkiOiIifQ.r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI",
          code: "",
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request is missing code parameter",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_request error when the client_assertion_type is not included for a private_key_jwt request", async () => {
    await expect(
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          redirect_uri: "https://example.com/authentication-callback/",
          code: "1234",
          client_assertion:
            "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIiLCJpc3MiOiIiLCJhdWQiOiIiLCJqdGkiOiIifQ.r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI",
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_request",
        errorDescription: "Invalid token authentication method used",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_request error when the client_assertion is not included for a private_key_jwt request", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          redirect_uri: "https://example.com/authentication-callback/",
          code: "1234",
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_request",
        errorDescription: "Invalid token authentication method used",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_request error when the client_secret is not included for a client_secret_post request", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          redirect_uri: "https://example.com/authentication-callback/",
          code: "1234",
          client_id: "12345",
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_request",
        errorDescription: "Invalid token authentication method used",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_request error when the client_id is not included for a client_secret_psot request", async () => {
    await expect(() =>
      parseTokenRequest(
        {
          grant_type: "authorization_code",
          redirect_uri: "https://example.com/authentication-callback/",
          code: "1234",
          client_secret: "super-secret-secret",
        },
        config
      )
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_request",
        errorDescription: "Invalid token authentication method used",
        httpStatusCode: 400,
      })
    );
  });

  it("returns an object with a private key jwt validator when a valid private key jwt request is provided", async () => {
    const validPrivateKeyJwtRequest = {
      grant_type: "authorization_code",
      redirect_uri: "https://example.com/authentication-callback/",
      code: "1234",
      client_assertion_type:
        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIiLCJpc3MiOiIiLCJhdWQiOiIiLCJqdGkiOiIifQ.r1Ylfhhy6VNSlhlhW1N89F3WfIGuko2rvSRWO4yK1BI",
    };

    const res = await parseTokenRequest(validPrivateKeyJwtRequest, config);

    expect(res.validateClientAuthentication).toBeDefined();
    res.validateClientAuthentication();
    expect(privateKeyJwtValidatorMock).toHaveBeenCalledWith(
      validPrivateKeyJwtRequest,
      config
    );
    expect(clientSecretValidatorMock).not.toHaveBeenCalled();
  });

  it("returns an object with a client_secret_post validator when a valid client_secret_post request is provided", async () => {
    const validClientSecretPostRequest = {
      grant_type: "authorization_code",
      redirect_uri: "https://example.com/authentication-callback/",
      code: "1234",
      client_id: "123456",
      client_secret: "super-secret-secret",
    };

    const res = await parseTokenRequest(validClientSecretPostRequest, config);

    expect(res.validateClientAuthentication).toBeDefined();
    res.validateClientAuthentication();
    expect(clientSecretValidatorMock).toHaveBeenCalledWith(
      validClientSecretPostRequest,
      config
    );
    expect(privateKeyJwtValidatorMock).not.toHaveBeenCalled();
  });
});
