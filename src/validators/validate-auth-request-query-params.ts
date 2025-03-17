import { AuthoriseRequestError } from "../errors/authorise-request-error";
import { BadRequestError } from "../errors/bad-request-error";
import { logger } from "../logger";
import { areClaimsValid } from "./claims-validator";
import { areScopesValid } from "./scope-validator";
import { vtrValidator } from "./vtr-validator";
import { Config } from "../config";
import { AuthRequest } from "src/parse/parse-auth-request";
import { validatePKCECodeChallengeAndMethod } from "./code-challenge-validator";

export const validateAuthRequestQueryParams = (
  queryParams: AuthRequest,
  config: Config
): void => {
  if (!config.getRedirectUrls().includes(queryParams.redirect_uri)) {
    logger.warn(
      "Redirect URI not valid for client: " + queryParams.redirect_uri
    );
    throw new BadRequestError("Invalid request");
  }

  if (!queryParams.state) {
    throw new AuthoriseRequestError({
      errorCode: "invalid_request",
      errorDescription: "Request is missing state parameter",
      httpStatusCode: 302,
      redirectUri: queryParams.redirect_uri,
      state: null,
    });
  }

  if (queryParams.request_uri) {
    logger.warn("Request URI parameter not supported");
    throw new AuthoriseRequestError({
      errorCode: "request_uri_not_supported",
      errorDescription: "Request URI parameter not supported",
      httpStatusCode: 302,
      redirectUri: queryParams.redirect_uri,
      state: queryParams.state,
    });
  }

  if (queryParams.response_type !== "code") {
    logger.error(
      "Unsupported responseType included in request. Expected responseType of code"
    );
    throw new AuthoriseRequestError({
      errorCode: "unsupported_response_type",
      errorDescription: "Unsupported response type",
      httpStatusCode: 302,
      redirectUri: queryParams.redirect_uri,
      state: queryParams.state,
    });
  }

  //Scopes are space-delim https://datatracker.ietf.org/doc/html/rfc6749#section-3.3:~:text=The%20value%20of%20the%20scope%20parameter%20is%20expressed%20as%20a%20list%20of%20space%2D%0A%20%20%20delimited%2C%20case%2Dsensitive%20strings

  if (!areScopesValid(queryParams.scope, config)) {
    throw new AuthoriseRequestError({
      errorCode: "invalid_scope",
      errorDescription: "Invalid, unknown or malformed scope",
      httpStatusCode: 302,
      redirectUri: queryParams.redirect_uri,
      state: queryParams.state,
    });
  }

  if (!areClaimsValid(queryParams.claims, config)) {
    throw new AuthoriseRequestError({
      errorCode: "invalid_request",
      errorDescription: "Request contains invalid claims",
      httpStatusCode: 302,
      redirectUri: queryParams.redirect_uri,
      state: queryParams.state,
    });
  }

  if (!queryParams.nonce) {
    logger.error("No nonce parameter included in authorisation request");
    throw new AuthoriseRequestError({
      errorCode: "invalid_request",
      errorDescription: "Request is missing nonce parameter",
      httpStatusCode: 302,
      redirectUri: queryParams.redirect_uri,
      state: queryParams.state,
    });
  }

  queryParams["vtr"] = vtrValidator(
    queryParams.vtr as string,
    config,
    queryParams.state,
    queryParams.redirect_uri
  );

  if (queryParams.max_age && queryParams.max_age < -1) {
    logger.error("Negative max_age in authorise request");
    throw new AuthoriseRequestError({
      errorCode: "invalid_request",
      errorDescription: "Max age is negative in query params",
      httpStatusCode: 302,
      redirectUri: queryParams.redirect_uri,
      state: queryParams.state,
    });
  }

  if (config.isPKCEEnabled()) {
    validatePKCECodeChallengeAndMethod(
      queryParams.redirect_uri,
      queryParams.state,
      queryParams.code_challenge,
      queryParams.code_challenge_method
    );
  }

  if (
    queryParams.response_mode &&
    queryParams.response_mode !== "query" &&
    queryParams.response_mode !== "fragment"
  ) {
    logger.error(
      `Invalid response mode in request: ${queryParams.response_mode}`
    );
    throw new BadRequestError("Invalid request");
  }
};
