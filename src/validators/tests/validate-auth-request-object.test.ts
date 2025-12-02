import { RequestObject } from "../../parse/parse-auth-request";
import { validateAuthRequestObject } from "../validate-auth-request-object";
import { Config } from "../../config";
import { BadRequestError } from "../../errors/bad-request-error";
import { JWK, jwtVerify } from "jose";
import { AuthoriseRequestError } from "../../errors/authorise-request-error";
import { TrustChainValidationError } from "../../errors/trust-chain-validation-error";

const config = Config.getInstance();
const jwksUrlSpy = jest.spyOn(config, "getJwksUrl");
const defaultRedirectUri = config.getRedirectUrls()[0];
const defaultState = "123456789";
const defaultClientId = config.getClientId();
const validClaim = "https://vocab.account.gov.uk/v1/coreIdentityJWT";
const claims = `{"userinfo":{"${validClaim}":null}}`;
const defaultAuthRequest = {
  response_type: "code",
  redirect_uri: defaultRedirectUri,
  client_id: defaultClientId,
  state: defaultState,
  nonce: "987654321",
  scope: ["openid"],
  claims: [validClaim],
  vtr: [],
  prompt: [],
  ui_locales: [],
  max_age: 123,
};

jest.mock("jose");

describe("Validate auth request object tests", () => {
  beforeEach(() => {
    (jwtVerify as jest.Mock).mockImplementation();
    config.setPublicKeySource("STATIC");
  });

  describe("Using public key source = JWKS", () => {
    beforeEach(() => {
      config.setPublicKeySource("JWKS");
      jwksUrlSpy.mockReturnValue("http://example.com/well-known/jwks.json");
      mockJwks([{ alg: "RS256", kty: "RSA", kid: "test-key-id", use: "sig" }]);
      config.clearJwksCache();
    });

    it("throw error when kid not in request object header", async () => {
      const requestObject = {
        ...requestObjectWithParams({}),
        header: {
          alg: "RS256",
        },
      };
      const authRequest = {
        ...defaultAuthRequest,
        requestObject,
      };
      await expect(
        validateAuthRequestObject(authRequest, config)
      ).rejects.toThrow(
        new Error(
          "No kid present in request object header, cannot verify JWT signature"
        )
      );
    });
    it("throw error when JWKS URL not set in config", async () => {
      jwksUrlSpy.mockReturnValue(undefined);
      const requestObject = {
        ...requestObjectWithParams({}),
        header: {
          alg: "RS256",
          kid: "test-key-id",
        },
      };
      const authRequest = {
        ...defaultAuthRequest,
        requestObject,
      };
      await expect(
        validateAuthRequestObject(authRequest, config)
      ).rejects.toThrow(new Error("No JWKS url set, returning"));
    });

    it("throw error when key with kid not found", async () => {
      const requestObject = {
        ...requestObjectWithParams({}),
        header: {
          alg: "RS256",
          kid: "not-a-key-on-jwks-endpoint",
        },
      };
      const authRequest = {
        ...defaultAuthRequest,
        requestObject,
      };
      await expect(
        validateAuthRequestObject(authRequest, config)
      ).rejects.toThrow(
        new Error(
          "No RSA signing key found on JWKS URL http://example.com/well-known/jwks.json"
        )
      );
    });

    it("does not throw error when key found on JWKS endpoint with kid", async () => {
      const requestObject = {
        ...requestObjectWithParams({}),
        header: {
          alg: "RS256",
          kid: "test-key-id",
        },
      };
      const authRequest = {
        ...defaultAuthRequest,
        requestObject,
      };
      await expect(
        validateAuthRequestObject(authRequest, config)
      ).resolves.not.toThrow();
    });

    const mockJwks = (jwks: JWK[]): void => {
      jest.spyOn(global, "fetch").mockImplementation(
        jest.fn(() =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                keys: jwks,
              }),
          })
        ) as jest.Mock
      );
    };
  });

  it("throw parse request error when signature check fails", async () => {
    (jwtVerify as jest.Mock).mockImplementation(() => {
      throw new Error();
    });
    const requestObject = defaultRequestObject;
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(new TrustChainValidationError());
  });

  it("throw bad request error when redirect_uri not present in request object", async () => {
    const requestObject = requestObjectWithParams({
      redirect_uri: undefined,
    });
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new BadRequestError("Invalid Redirect URI in request: undefined")
    );
  });

  it("throw bad request error when redirect_uri is invalid in request object", async () => {
    const requestObject = requestObjectWithParams({
      redirect_uri: "not-a-valid-uri",
    });
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new BadRequestError("Invalid Redirect URI in request: not-a-valid-uri")
    );
  });

  it("throw authorise request error when state not present in request object", async () => {
    const requestObject = requestObjectWithParams({
      state: undefined,
    });
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "invalid_request",
        errorDescription: "Request is missing state parameter",
        redirectUri: defaultRedirectUri,
        state: null,
      })
    );
  });

  it("throw authorise request error when response_type is invalid in auth request", async () => {
    const requestObject = defaultRequestObject;
    const authRequest = {
      ...defaultAuthRequest,
      response_type: "invalid-response-type",
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "unsupported_response_type",
        errorDescription: "Unsupported response type",
        redirectUri: defaultRedirectUri,
        state: defaultState,
      })
    );
  });

  it("throw authorise request error when scopes are invalid in auth request", async () => {
    const requestObject = defaultRequestObject;
    const authRequest = {
      ...defaultAuthRequest,
      scope: ["invalid-scope"],
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "invalid_scope",
        errorDescription: "Invalid, unknown or malformed scope",
        redirectUri: defaultRedirectUri,
        state: defaultState,
      })
    );
  });

  it("throw authorise request error when client_id does not match request object", async () => {
    const requestObject = requestObjectWithParams({
      client_id: "client-id-2",
    });
    const authRequest = {
      ...defaultAuthRequest,
      client_id: defaultClientId,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "unauthorized_client",
        errorDescription: "Unauthorized client",
        redirectUri: defaultRedirectUri,
        state: defaultState,
      })
    );
  });

  it("throw authorise request error when request present in request object", async () => {
    const requestObject = requestObjectWithParams({
      request: defaultRequestObject,
    });
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "invalid_request",
        errorDescription: "Invalid request",
        redirectUri: defaultRedirectUri,
        state: defaultState,
      })
    );
  });

  it("throw authorise request error when request_uri present in request object", async () => {
    const requestObject = requestObjectWithParams({
      request_uri: "http://example.com/authorise",
    });
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "invalid_request",
        errorDescription: "Invalid request",
        redirectUri: defaultRedirectUri,
        state: defaultState,
      })
    );
  });

  it("throw authorise request error when audience not present in request object", async () => {
    const requestObject = requestObjectWithParams({
      aud: undefined,
    });
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "access_denied",
        errorDescription:
          "Access denied by resource owner or authorization server",
        redirectUri: defaultRedirectUri,
        state: defaultState,
      })
    );
  });

  it("throw authorise request error when audience is invalid in request object", async () => {
    const requestObject = requestObjectWithParams({
      aud: "invalid-audience",
    });
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "access_denied",
        errorDescription:
          "Access denied by resource owner or authorization server",
        redirectUri: defaultRedirectUri,
        state: defaultState,
      })
    );
  });

  it("throw authorise request error when issuer not present in request object", async () => {
    const requestObject = requestObjectWithParams({
      iss: undefined,
    });
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "unauthorized_client",
        errorDescription: "Unauthorized client",
        redirectUri: defaultRedirectUri,
        state: defaultState,
      })
    );
  });

  it("throw authorise request error when issuer is invalid in request object", async () => {
    const requestObject = requestObjectWithParams({
      iss: "invalid-issuer",
    });
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "unauthorized_client",
        errorDescription: "Unauthorized client",
        redirectUri: defaultRedirectUri,
        state: defaultState,
      })
    );
  });

  it("throw authorise request error when response_type is invalid in request object", async () => {
    const requestObject = requestObjectWithParams({
      response_type: "invalid-response-type",
    });
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "unsupported_response_type",
        errorDescription: "Unsupported response type",
        redirectUri: defaultRedirectUri,
        state: defaultState,
      })
    );
  });

  it("throw authorise request error when scopes are invalid in request object", async () => {
    const requestObject = requestObjectWithParams({
      scope: "invalid-scope",
    });
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "invalid_scope",
        errorDescription: "Invalid, unknown or malformed scope",
        redirectUri: defaultRedirectUri,
        state: defaultState,
      })
    );
  });

  it("throw authorise request error when claims are invalid in request object", async () => {
    const requestObject = requestObjectWithParams({
      claims: {
        userinfo: {
          "invalid-claim": { essential: true },
        },
      },
    });
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new AuthoriseRequestError({
        errorCode: "invalid_request",
        errorDescription: "Request contains invalid claims",
        httpStatusCode: 302,
        redirectUri: defaultRedirectUri,
        state: defaultState,
      })
    );
  });

  it("throw authorise request error when nonce not present in request object", async () => {
    const requestObject = requestObjectWithParams({
      nonce: undefined,
    });
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "invalid_request",
        errorDescription: "Request is missing nonce parameter",
        redirectUri: defaultRedirectUri,
        state: defaultState,
      })
    );
  });

  it("throw authorise request error when max_age is negative in request object", async () => {
    const requestObject = requestObjectWithParams({
      max_age: -1,
    });
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "invalid_request",
        errorDescription: "Max age is negative in request object",
        redirectUri: defaultRedirectUri,
        state: defaultState,
      })
    );
  });

  it("throw authorise request error when max_age is not a number in request object", async () => {
    const requestObject = requestObjectWithParams({
      max_age: "not-a-number",
    });
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "invalid_request",
        errorDescription: "Max age could not be parsed to an integer",
        redirectUri: defaultRedirectUri,
        state: defaultState,
      })
    );
  });

  it("throw authorise request error when login_hint is too long in request object", async () => {
    const requestObject = requestObjectWithParams({
      login_hint:
        "1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111@email.com",
    });
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "invalid_request",
        errorDescription: "login_hint parameter is invalid",
        redirectUri: defaultRedirectUri,
        state: defaultState,
      })
    );
  });

  it("throw authorise request error when channel is invalid in request object", async () => {
    const requestObject = requestObjectWithParams({
      channel: "invalid-channel",
    });
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(
      new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "invalid_request",
        errorDescription: "Invalid value for channel parameter.",
        redirectUri: defaultRedirectUri,
        state: defaultState,
      })
    );
  });

  it("not throw an error when channel is valid in request object", async () => {
    const requestObject = requestObjectWithParams({
      channel: "generic_app",
    });
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).resolves.not.toThrow();
  });

  it("throw bad request error response_mode for unknown response_mode", async () => {
    const requestObject = requestObjectWithParams({
      response_mode: "code",
    });
    const authRequest = {
      ...defaultAuthRequest,
      requestObject,
    };

    await expect(
      validateAuthRequestObject(authRequest, config)
    ).rejects.toThrow(new BadRequestError("Invalid request"));
  });

  describe('when PKCE_ENABLED is set to "true"', () => {
    beforeAll(() => {
      jest.spyOn(config, "isPKCEEnabled").mockReturnValue(true);
    });

    afterAll(() => {
      jest.spyOn(config, "isPKCEEnabled").mockReturnValue(false);
    });

    it("throw authorise request error when code challenge method is not S256", async () => {
      const requestObject = requestObjectWithParams({
        code_challenge_method: "not-S256",
        code_challenge: "code-challenge",
      });
      const authRequest = {
        ...defaultAuthRequest,
        requestObject,
      };

      await expect(
        validateAuthRequestObject(authRequest, config)
      ).rejects.toThrow(
        new AuthoriseRequestError({
          httpStatusCode: 302,
          errorCode: "invalid_request",
          errorDescription:
            "Invalid value for code_challenge_method parameter.",
          redirectUri: defaultRedirectUri,
          state: defaultState,
        })
      );
    });

    it("throw authorise request error when code challenge method is null", async () => {
      const requestObject = requestObjectWithParams({
        code_challenge: "code-challenge",
      });
      const authRequest = {
        ...defaultAuthRequest,
        requestObject,
      };

      await expect(
        validateAuthRequestObject(authRequest, config)
      ).rejects.toThrow(
        new AuthoriseRequestError({
          httpStatusCode: 302,
          errorCode: "invalid_request",
          errorDescription:
            "Request is missing code_challenge_method parameter. code_challenge_method is required when code_challenge is present.",
          redirectUri: defaultRedirectUri,
          state: defaultState,
        })
      );
    });

    it("throw authorise request error when code challenge is whitespace", async () => {
      const requestObject = requestObjectWithParams({
        code_challenge_method: "S256",
        code_challenge: " ",
      });
      const authRequest = {
        ...defaultAuthRequest,
        requestObject,
      };

      await expect(
        validateAuthRequestObject(authRequest, config)
      ).rejects.toThrow(
        new AuthoriseRequestError({
          httpStatusCode: 302,
          errorCode: "invalid_request",
          errorDescription: "Invalid value for code_challenge parameter.",
          redirectUri: defaultRedirectUri,
          state: defaultState,
        })
      );
    });

    it("does not throw when auth request is valid with valid code challenge", async () => {
      const requestObject = requestObjectWithParams({
        code_challenge_method: "S256",
        code_challenge: "code-challenge",
      });
      const authRequest = {
        ...defaultAuthRequest,
        requestObject,
      };

      await expect(
        validateAuthRequestObject(authRequest, config)
      ).resolves.not.toThrow();
    });
  });
});

it("does not throw when auth request is valid", async () => {
  const requestObject = defaultRequestObject;
  const authRequest = {
    ...defaultAuthRequest,
    requestObject,
  };

  await expect(
    validateAuthRequestObject(authRequest, config)
  ).resolves.not.toThrow();
});

it("does not throw when auth request is valid with login_hint", async () => {
  const requestObject = requestObjectWithParams({
    login_hint: "email@email.com",
  });
  const authRequest = {
    ...defaultAuthRequest,
    requestObject,
  };

  await expect(
    validateAuthRequestObject(authRequest, config)
  ).resolves.not.toThrow();
});

const requestObjectWithParams = (params: object): RequestObject => {
  return {
    header: {},
    payload: {
      redirect_uri: defaultRedirectUri,
      client_id: defaultClientId,
      response_type: "code",
      state: defaultState,
      iss: defaultClientId,
      scope: "openid",
      aud: `${config.getSimulatorUrl()}/authorize`,
      nonce: "987654321",
      max_age: 123,
      claims,
      ...params,
    },
    encodedJwt: "",
  };
};
const defaultRequestObject = requestObjectWithParams({});
