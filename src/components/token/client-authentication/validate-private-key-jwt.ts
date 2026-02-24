import {
  decodeJwt,
  decodeProtectedHeader,
  errors,
  importJWK,
  importSPKI,
  JWTPayload,
  jwtVerify,
} from "jose";
import { Config } from "../../../config";
import { logger } from "../../../logger";
import { TokenRequestError } from "../../../errors/token-request-error";
import {
  ClientAssertionHeader,
  PrivateKeyJwt,
} from "src/types/private-key-jwt";
import { ParseTokenRequestError } from "../../../errors/parse-token-request-error";
import { TokenRequest } from "../../../types/token-request";
import { JwksError } from "../../../errors/jwks-error";

export const validatePrivateKeyJwt = async (
  tokenRequestBody: Record<string, string>,
  config: Config
): Promise<TokenRequest> => {
  if (
    tokenRequestBody.client_assertion_type !==
    "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
  ) {
    logger.warn(
      { client_assertion_type: tokenRequestBody.client_assertion_type },
      "Client Auth Method is private_key_jwt but client_assertion_type is incorrect"
    );

    throw new TokenRequestError({
      errorCode: "invalid_request",
      errorDescription: "Invalid private_key_jwt",
      httpStatusCode: 400,
    });
  }

  const parsedClientAssertion = parseClientAssertion(
    tokenRequestBody.client_assertion,
    tokenRequestBody.client_id
  );

  if (parsedClientAssertion.clientId !== config.getClientId()) {
    logger.warn("Invalid Client provided in private_key_jwt");
    throw new TokenRequestError({
      errorCode: "invalid_client",
      errorDescription: "Client authentication failed",
      httpStatusCode: 401,
    });
  }

  if (isPrivateKeyJwtExpired(parsedClientAssertion.payload.exp)) {
    logger.warn("private_key_jwt has expired");
    throw new TokenRequestError({
      errorCode: "invalid_grant",
      errorDescription: "private_key_jwt has expired",
      httpStatusCode: 400,
    });
  }

  if (
    (typeof parsedClientAssertion.payload.aud === "string" &&
      !config
        .getExpectedPrivateKeyJwtAudiences()
        .includes(parsedClientAssertion.payload.aud)) ||
    (Array.isArray(parsedClientAssertion.payload.aud) &&
      !parsedClientAssertion.payload.aud.every((aud) =>
        config.getExpectedPrivateKeyJwtAudiences().includes(aud)
      ))
  ) {
    //We need to error here to match the validation in the token handler
    //This matches the validation here https://github.com/govuk-one-login/authentication-api/blob/dc42596ab02184f80c30f327a7dcd0f76146e619/orchestration-shared/src/main/java/uk/gov/di/orchestration/shared/services/ClientSignatureValidationService.java#L103 where the audience is validated in the client signature
    // validation service
    logger.warn(
      `Invalid audience in client JWT assertion: Expected: ${config.getExpectedPrivateKeyJwtAudiences()}, Received: ${parsedClientAssertion.payload.aud}`
    );

    throw new TokenRequestError({
      errorCode: "invalid_client",
      errorDescription: "Invalid signature in private_key_jwt",
      httpStatusCode: 400,
    });
  }

  if (parsedClientAssertion.payload.sub !== parsedClientAssertion.payload.iss) {
    logger.warn(
      {
        iss_claim: parsedClientAssertion.payload.iss,
        sub_claim: parsedClientAssertion.payload.sub,
      },
      "client_assertion iss and sub claims do not match"
    );

    throw new TokenRequestError({
      errorCode: "invalid_client",
      errorDescription: "Invalid signature in private_key_jwt",
      httpStatusCode: 400,
    });
  }
  let signatureValid = false;
  try {
    signatureValid = await isSignatureValid(
      config,
      parsedClientAssertion.header,
      parsedClientAssertion.token
    );
  } catch (error) {
    logger.warn(
      `Error thrown when trying to validate signature: ${(error as Error).message}`
    );
    throw new JwksError(
      "Failed to fetch or parse JWKS to verify signature of private_key_jwt"
    );
  }
  if (!signatureValid) {
    logger.warn("Could not verify signature of private_key_jwt");
    throw new TokenRequestError({
      errorCode: "invalid_client",
      errorDescription: "Invalid signature in private_key_jwt",
      httpStatusCode: 400,
    });
  }
  return tokenRequestBody as TokenRequest;
};

const parseClientAssertion = (
  clientAssertion: string,
  tokenRequestClientId?: string
): PrivateKeyJwt => {
  const jwtParts = clientAssertion.split(".");

  if (jwtParts.length !== 3) {
    throw new ParseTokenRequestError(
      "Invalid client_assertion JWT: Unexpected number of Base64URL parts, must be three"
    );
  }

  let payload: JWTPayload;
  try {
    payload = decodeJwt(clientAssertion);
  } catch (error) {
    if (error instanceof errors.JWTInvalid) {
      logger.error("Invalid JSON in client_assertion: " + error.message);
      throw new ParseTokenRequestError(
        "Payload of JWS object is not a valid JSON object"
      );
    } else throw error;
  }
  const header = decodeProtectedHeader(clientAssertion);
  const signature = jwtParts[2];

  if (!signature || signature.trim().length === 0) {
    throw new ParseTokenRequestError(
      "Invalid client_assertion JWT: The signature must not be empty"
    );
  }

  if (!payload.sub) {
    throw new ParseTokenRequestError(
      "Invalid client_assertion JWT: Missing subject in client JWT assertion"
    );
  }

  if (!payload.iss) {
    throw new ParseTokenRequestError(
      "Invalid client_assertion JWT: Missing issuer in client JWT assertion"
    );
  }

  if (!payload.aud) {
    throw new ParseTokenRequestError(
      "Invalid client_assertion JWT: Missing audience in client JWT assertion"
    );
  }

  if (!payload.exp || typeof payload.exp !== "number") {
    throw new ParseTokenRequestError(
      "Invalid client_assertion JWT: Missing or invalid expiry in client JWT assertion"
    );
  }

  if (payload.nbf) {
    //We don't care about this claim but it can be included and
    //can cause a ParseError if the claim is invalid
    logger.warn(
      "nbf claim included in client JWT assertion, this claim is not needed: https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/authenticate-your-user/#create-a-jwt"
    );

    if (typeof payload.nbf !== "number") {
      throw new ParseTokenRequestError(
        "Invalid client_assertion JWT: Invalid nbf claim in client JWT assertion"
      );
    }
  }

  if (!payload.iat) {
    logger.warn(
      "iat claim not included in client JWT assertion, this claim is recommended: https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/authenticate-your-user/#create-a-jwt"
    );
  }

  if (payload.iat && typeof payload.iat !== "number") {
    throw new ParseTokenRequestError(
      "Invalid client_assertion JWT: Invalid iat claim in client JWT assertion"
    );
  }

  if (!payload.jti) {
    logger.warn(
      "No jti claim in client JWT assertion, this is required: https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/authenticate-your-user/#create-a-jwt"
    );
  }

  if (
    !header.alg ||
    !["RS256", "RS384", "RS512", "PS256", "PS384", "PS512"].includes(header.alg)
  ) {
    throw new ParseTokenRequestError(
      "Invalid client_assertion JWT: The client assertion JWT must be RSA or ECDSA-signed (RS256, RS384, RS512, PS256, PS384, PS512, ES256, ES384 or ES512)"
    );
  }

  if (tokenRequestClientId && tokenRequestClientId !== payload.sub) {
    throw new ParseTokenRequestError(
      "Invalid client_assertion JWT: The client identifier doesn't match the client assertion subject"
    );
  }

  return {
    header: header as ClientAssertionHeader,
    payload: {
      exp: payload.exp,
      sub: payload.sub,
      iss: payload.iss,
      aud: payload.aud,
      ...(payload.jti && { jti: payload.jti }),
      ...(payload.iat && { iat: payload.iat }),
    },
    signature,
    clientId: payload.sub,
    token: clientAssertion,
  };
};

const addAffixesToPublicKeyIfNotPresent = (publicKey: string) => {
  let publicKeyWithAffixes = publicKey;
  if (!publicKey.startsWith("-----BEGIN PUBLIC KEY-----")) {
    logger.info("Public key does not have expected prefix. Adding prefix.");
    publicKeyWithAffixes = "-----BEGIN PUBLIC KEY-----" + publicKeyWithAffixes;
  }
  if (!publicKey.endsWith("-----END PUBLIC KEY-----")) {
    logger.info("Public key does not have expected suffix. Adding suffix.");
    publicKeyWithAffixes = publicKeyWithAffixes + "-----END PUBLIC KEY-----";
  }
  return publicKeyWithAffixes;
};

const isPrivateKeyJwtExpired = (exp: number): boolean => {
  const currentTimeInSeconds = Math.floor(Date.now() / 1000);
  return currentTimeInSeconds > exp;
};

const isSignatureValid = async (
  config: Config,
  header: ClientAssertionHeader,
  token: string
): Promise<boolean> => {
  let parsedPublicKey;
  if (config.getPublicKeySource() === "STATIC") {
    const clientPublicKey = addAffixesToPublicKeyIfNotPresent(
      config.getPublicKey()
    );
    parsedPublicKey = await importSPKI(clientPublicKey, header.alg);
  } else {
    const jwk = await config.getRpSigningKey(header.kid);
    parsedPublicKey = await importJWK(jwk);
  }
  return isSignatureValidUsingKeyLike(parsedPublicKey, token);
};

const isSignatureValidUsingKeyLike = async (
  parsedPublicKey: CryptoKey | Uint8Array,
  token: string
): Promise<boolean> => {
  try {
    await jwtVerify(token, parsedPublicKey);
    return true;
  } catch (error) {
    logger.error("Error validating signature: " + (error as Error).message);
    return false;
  }
};
