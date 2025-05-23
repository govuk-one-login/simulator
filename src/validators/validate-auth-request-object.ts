import { importSPKI, JWTPayload, jwtVerify } from "jose";
import { Config } from "../config";
import { AuthoriseRequestError } from "../errors/authorise-request-error";
import { BadRequestError } from "../errors/bad-request-error";
import { TrustChainValidationError } from "../errors/trust-chain-validation-error";
import { logger } from "../logger";
import { AuthRequest, RequestObject } from "../parse/parse-auth-request";
import {
  getRequestObjectVtrAsString,
  parseRequestObjectClaims,
  parseUiLocales,
  isValidUri,
} from "../utils/utils";
import { areScopesValid } from "./scope-validator";
import { vtrValidator } from "./vtr-validator";
import { areClaimsValid } from "./claims-validator";
import { validatePKCECodeChallengeAndMethod } from "./code-challenge-validator";

export const validateAuthRequestObject = async (
  authRequest: AuthRequest,
  config: Config
): Promise<void> => {
  const requestObject = authRequest.requestObject!;
  await validateJwtSignature(requestObject, config.getPublicKey());

  const payload = requestObject.payload;
  const redirectUri = payload["redirect_uri"] as string;

  if (!redirectUri || !config.getRedirectUrls().includes(redirectUri)) {
    throw new BadRequestError(
      "Invalid Redirect URI in request: " + redirectUri
    );
  }

  if (!isValidUri(redirectUri)) {
    throw new Error(
      "Failed to parse redirect_uri as valid uri: " + redirectUri
    );
  }

  if (
    payload.response_mode &&
    payload.response_mode !== "query" &&
    payload.response_mode !== "fragment"
  ) {
    logger.error(`Invalid response mode in request: ${payload.response_mode}`);
    throw new BadRequestError("Invalid request");
  }

  if (!payload.state) {
    logger.warn("State parameter not in request object");
    throw new AuthoriseRequestError({
      httpStatusCode: 302,
      errorCode: "invalid_request",
      errorDescription: "Request is missing state parameter",
      redirectUri: redirectUri,
      state: null,
    });
  }

  if (authRequest.response_type !== "code") {
    logger.error(
      "Unsupported responseType included in request. Expected responseType of code"
    );
    throw new AuthoriseRequestError({
      httpStatusCode: 302,
      errorCode: "unsupported_response_type",
      errorDescription: "Unsupported response type",
      redirectUri: redirectUri,
      state: payload.state as string,
    });
  }

  if (!areScopesValid(authRequest.scope, config)) {
    logger.error("Invalid scopes in auth request");
    throw new AuthoriseRequestError({
      httpStatusCode: 302,
      errorCode: "invalid_scope",
      errorDescription: "Invalid, unknown or malformed scope",
      redirectUri: redirectUri,
      state: payload.state as string,
    });
  }

  if (!payload.client_id || authRequest.client_id !== payload.client_id) {
    logger.error("oAuth client_id parameter does not match request object");
    throw new AuthoriseRequestError({
      httpStatusCode: 302,
      errorCode: "unauthorized_client",
      errorDescription: "Unauthorized client",
      redirectUri: redirectUri,
      state: payload.state as string,
    });
  }

  if (payload.request || payload.request_uri) {
    logger.error("request or request_uri claim should not be in request JWT");
    throw new AuthoriseRequestError({
      httpStatusCode: 302,
      errorCode: "invalid_request",
      errorDescription: "Invalid request",
      redirectUri: redirectUri,
      state: payload.state as string,
    });
  }

  if (!payload.aud || payload.aud !== `${config.getSimulatorUrl()}/authorize`) {
    logger.error("Request object audience invalid: " + payload.aud);
    throw new AuthoriseRequestError({
      httpStatusCode: 302,
      errorCode: "access_denied",
      errorDescription:
        "Access denied by resource owner or authorization server",
      redirectUri: redirectUri,
      state: payload.state as string,
    });
  }

  if (!payload.iss || payload.iss !== authRequest.client_id) {
    logger.error("Request object issuer is invalid " + payload.iss);
    throw new AuthoriseRequestError({
      httpStatusCode: 302,
      errorCode: "unauthorized_client",
      errorDescription: "Unauthorized client",
      redirectUri: redirectUri,
      state: payload.state as string,
    });
  }

  if (payload.response_type !== "code") {
    logger.error("Unsupported responseType included in request object");
    throw new AuthoriseRequestError({
      httpStatusCode: 302,
      errorCode: "unsupported_response_type",
      errorDescription: "Unsupported response type",
      redirectUri: redirectUri,
      state: payload.state as string,
    });
  }

  const requestObjectScopes = (payload.scope as string)?.split(" ");
  if (!requestObjectScopes || !areScopesValid(requestObjectScopes, config)) {
    logger.error("Invalid scopes in request object");
    throw new AuthoriseRequestError({
      httpStatusCode: 302,
      errorCode: "invalid_scope",
      errorDescription: "Invalid, unknown or malformed scope",
      redirectUri: redirectUri,
      state: payload.state as string,
    });
  }

  validateClaims(payload, config);

  if (!payload.nonce) {
    logger.error("No nonce parameter included in authorisation request");
    throw new AuthoriseRequestError({
      httpStatusCode: 302,
      errorCode: "invalid_request",
      errorDescription: "Request is missing nonce parameter",
      redirectUri: redirectUri,
      state: payload.state as string,
    });
  }

  payload.vtr = vtrValidator(
    getRequestObjectVtrAsString(payload),
    config,
    payload.state as string,
    redirectUri
  );

  if (payload.ui_locales) {
    payload.ui_locales = parseUiLocales(payload.ui_locales as string);
  }

  validateMaxAge(payload);

  if (config.isPKCEEnabled()) {
    validatePKCECodeChallengeAndMethod(
      payload.redirect_uri as string,
      payload.state as string,
      payload.code_challenge as string,
      payload.code_challenge_method as string
    );
  }

  validateLoginHint(payload);

  logger.info("RequestObject has passed initial validation");
};

async function validateJwtSignature(
  requestObject: RequestObject,
  publicKey: string
) {
  const signingKey = await importSPKI(publicKey, requestObject.header.alg!);
  try {
    await jwtVerify(requestObject?.encodedJwt, signingKey);
  } catch (error) {
    logger.error("Failed to validate signature: " + (error as Error).message);
    throw new TrustChainValidationError();
  }
}

const validateClaims = (payload: JWTPayload, config: Config) => {
  if (
    payload.claims &&
    !areClaimsValid(parseRequestObjectClaims(payload.claims), config)
  ) {
    throw new AuthoriseRequestError({
      httpStatusCode: 302,
      errorCode: "invalid_request",
      errorDescription: "Request contains invalid claims",
      redirectUri: payload.redirect_uri as string,
      state: payload.state as string,
    });
  }
};

const validateMaxAge = (payload: JWTPayload) => {
  if (payload.max_age) {
    const parsedMaxAge = parseInt(payload.max_age as string);

    if (parsedMaxAge < 0) {
      logger.warn("Max age is negative in request object");
      throw new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "invalid_request",
        errorDescription: "Max age is negative in request object",
        redirectUri: payload.redirect_uri as string,
        state: payload.state as string,
      });
    } else if (Number.isNaN(parsedMaxAge)) {
      throw new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "invalid_request",
        errorDescription: "Max age could not be parsed to an integer",
        redirectUri: payload.redirect_uri as string,
        state: payload.state as string,
      });
    }
  }
};

const validateLoginHint = (payload: JWTPayload) => {
  if (payload.login_hint) {
    const parsedLoginHint = payload.login_hint as string;

    if (parsedLoginHint !== null && parsedLoginHint.length > 256) {
      logger.warn("login_hint parameter is invalid");
      throw new AuthoriseRequestError({
        httpStatusCode: 302,
        errorCode: "invalid_request",
        errorDescription: "login_hint parameter is invalid",
        redirectUri: payload.redirect_uri as string,
        state: payload.state as string,
      });
    }
  }
};
