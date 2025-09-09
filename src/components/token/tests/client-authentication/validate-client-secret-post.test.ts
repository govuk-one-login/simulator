import { Config } from "../../../../config";
import { TokenRequest } from "../../../../types/token-request";
import { validateClientSecretPost } from "../../client-authentication/validate-client-secret-post";
import { TokenRequestError } from "../../../../errors/token-request-error";
import { TokenAuthMethod } from "../../../../validators/token-auth-method-validator";
import { randomBytes } from "crypto";
import { argon2id, hash } from "argon2";

describe("validateClientSecretPost tests", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("throws an invalid_request for no client_id", async () => {
    const invalidRequest = {};
    await expect(
      validateClientSecretPost(invalidRequest, Config.getInstance())
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_request",
        errorDescription: "Invalid client secret",
        httpStatusCode: 400,
      })
    );
  });
  it("throws an invalid_request for no client_secret", async () => {
    const invalidRequest = { client_id: "clientId" };
    await expect(
      validateClientSecretPost(invalidRequest, Config.getInstance())
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_request",
        errorDescription: "Invalid client secret",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_client for unknown client_id", async () => {
    const config = Config.getInstance();
    jest.spyOn(config, "getClientId").mockReturnValue("a-different-client-id");

    const validRequest = {
      client_id: "clientId",
      client_secret: "CWskGw2i7qWKMFL9HpuKec72cZGIQpEQA268gADMa9s=",
    };
    await expect(
      validateClientSecretPost(validRequest, config)
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_client",
        errorDescription: "Client authentication failed",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_client if the client is not configured to use client_secret_post", async () => {
    const clientId = "clientId";
    const config = Config.getInstance();
    jest.spyOn(config, "getClientId").mockReturnValue(clientId);

    jest.spyOn(config, "getTokenAuthMethod").mockReturnValue("private_key_jwt");

    const validRequest = {
      client_id: clientId,
      client_secret: "CWskGw2i7qWKMFL9HpuKec72cZGIQpEQA268gADMa9s=",
    };

    await expect(
      validateClientSecretPost(validRequest as TokenRequest, config)
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_client",
        errorDescription: "Client is not registered to use client_secret_post",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_client if the client is not configured to use client_secret_post", async () => {
    const clientId = "clientId";
    const config = Config.getInstance();
    jest.spyOn(config, "getClientId").mockReturnValue(clientId);

    jest
      .spyOn(config, "getTokenAuthMethod")
      .mockReturnValue(null as unknown as TokenAuthMethod);

    const validRequest = {
      client_id: clientId,
      client_secret: "CWskGw2i7qWKMFL9HpuKec72cZGIQpEQA268gADMa9s=",
    };

    await expect(
      validateClientSecretPost(validRequest as TokenRequest, config)
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_client",
        errorDescription: "Client is not registered to use client_secret_post",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_client if the client is not registered with a client secret hash", async () => {
    const clientId = "clientId";
    const config = Config.getInstance();
    jest.spyOn(config, "getClientId").mockReturnValue(clientId);

    jest
      .spyOn(config, "getTokenAuthMethod")
      .mockReturnValue("client_secret_post");

    jest
      .spyOn(config, "getClientSecretHash")
      .mockReturnValue(null as unknown as string);

    const validRequest = {
      client_id: clientId,
      client_secret: "CWskGw2i7qWKMFL9HpuKec72cZGIQpEQA268gADMa9s=",
    };

    await expect(
      validateClientSecretPost(validRequest as TokenRequest, config)
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_client",
        errorDescription: "No client secret registered",
        httpStatusCode: 400,
      })
    );
  });

  it("throws an invalid_client error with an invalid client secret description when provided an invalid secret", async () => {
    const clientId = "clientId";
    const config = Config.getInstance();

    jest.spyOn(config, "getClientId").mockReturnValue(clientId);

    jest
      .spyOn(config, "getTokenAuthMethod")
      .mockReturnValue("client_secret_post");

    const secret = randomBytes(40).toString("base64");
    const salt = randomBytes(64);
    const anotherSecret = randomBytes(40).toString("base64");

    const hashedSecret = await hash(secret, {
      salt,
      type: argon2id,
      memoryCost: 15360,
      hashLength: 16,
      parallelism: 1,
    });

    jest.spyOn(config, "getClientSecretHash").mockReturnValue(hashedSecret);

    const validRequest = {
      client_id: clientId,
      client_secret: anotherSecret,
      code: "abcd",
      redirectUri: "https://localhost:3000/redirect",
    };

    await expect(
      validateClientSecretPost(validRequest, config)
    ).rejects.toThrow(
      new TokenRequestError({
        errorCode: "invalid_client",
        errorDescription: "Invalid client secret",
        httpStatusCode: 400,
      })
    );
  });

  it("calls isClientSecretValid with the config stored hash and the provided secret", async () => {
    const clientId = "clientId";
    const config = Config.getInstance();

    jest.spyOn(config, "getClientId").mockReturnValue(clientId);

    jest
      .spyOn(config, "getTokenAuthMethod")
      .mockReturnValue("client_secret_post");

    const secret = randomBytes(40).toString("base64");
    const salt = randomBytes(64);

    const hashedSecret = await hash(secret, {
      salt,
      type: argon2id,
      memoryCost: 15360,
      hashLength: 16,
      parallelism: 1,
    });

    jest.spyOn(config, "getClientSecretHash").mockReturnValue(hashedSecret);

    const validRequest = {
      client_id: clientId,
      client_secret: secret,
      code: "abcd",
      redirectUri: "https://localhost:3000/redirect",
    };

    expect(await validateClientSecretPost(validRequest, config)).toStrictEqual({
      client_id: clientId,
      client_secret: secret,
      code: "abcd",
      redirectUri: "https://localhost:3000/redirect",
    });
  });
});
