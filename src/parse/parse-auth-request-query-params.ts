import { vtrValidator } from "../validators/vtr-validator";
import {
  SUPPORTED_UI_LOCALES,
  VALID_OIDC_PROMPTS,
  VALID_OIDC_RESPONSE_TYPES,
} from "../constants";
import { ParseAuthRequestError } from "../errors/parse-auth-request-error";
import { logger } from "../logger";
import { Request } from "express";
import { AuthoriseRequestError } from "../errors/authorise-request-error";
import { BadRequestError } from "../errors/bad-request-error";
import { Config } from "../config";
import { areScopesValid } from "../validators/scope-validator";
import { areClaimsValid } from "../validators/claims-validator";
import { MissingParameterError } from "../errors/missing-parameter-error";
import { VectorOfTrust } from "../types/vector-of-trust";

export type ParsedAuthRequestQueryParams = {
  response_type: string;
  redirect_uri: string;
  client_id: string;
  state: string;
  nonce: string;
  scope: string[];
  claims: string[];
  vtr: VectorOfTrust[];
  prompt: string[];
  ui_locales: string[];
};

export const parseAuthQueryParams = (
  queryParams: Record<string, string | undefined>,
  config: Config
): ParsedAuthRequestQueryParams => {
  if (isEmptyRequest(queryParams)) {
    throw new MissingParameterError(
      "Invalid Request: No Query parameters present in request"
    );
  }

  if (!queryParams.client_id) {
    throw new MissingParameterError(
      "Invalid Request: Missing client_id parameter"
    );
  }

  if (!queryParams.response_type) {
    throw new MissingParameterError(
      "Invalid Request: Missing response_type parameter"
    );
  }

  const includedPrompts = parsePrompts(
    queryParams.prompt,
    queryParams.client_id,
    queryParams.redirect_uri
  );

  if (!queryParams.redirect_uri || !isValidUri(queryParams.redirect_uri)) {
    throw new MissingParameterError(
      "Invalid Request: Invalid redirect_uri parameter"
    );
  }

  if (!queryParams.scope) {
    throw new ParseAuthRequestError(
      "Invalid Request: Missing scope parameter",
      queryParams.client_id,
      queryParams.redirect_uri
    );
  }

  if (!isResponseTypeValid(queryParams.response_type)) {
    throw new ParseAuthRequestError(
      "Invalid Request: Unsupported response_type parameter",
      queryParams.client_id,
      queryParams.redirect_uri
    );
  }

  //Scopes are space-delim https://datatracker.ietf.org/doc/html/rfc6749#section-3.3:~:text=The%20value%20of%20the%20scope%20parameter%20is%20expressed%20as%20a%20list%20of%20space%2D%0A%20%20%20delimited%2C%20case%2Dsensitive%20strings
  const scopes = queryParams.scope.split(" ");

  if (!scopes.includes("openid")) {
    throw new ParseAuthRequestError(
      "Invalid Request: The scope must include an openid value",
      queryParams.client_id,
      queryParams.redirect_uri
    );
  }

  const uiLocales = parseUiLocales(queryParams.ui_locales);

  const parsedClaims = parseClaims(
    queryParams.claims,
    queryParams.client_id,
    queryParams.redirect_uri
  );

  if (config.getClientId() !== queryParams.client_id) {
    throw new BadRequestError("Invalid request");
  }

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

  if (!areScopesValid(scopes, config)) {
    throw new AuthoriseRequestError({
      errorCode: "invalid_scope",
      errorDescription: "Invalid, unknown or malformed scope",
      httpStatusCode: 302,
      redirectUri: queryParams.redirect_uri,
      state: queryParams.state,
    });
  }

  if (!areClaimsValid(parsedClaims, config)) {
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

  const parsedVtrSet = vtrValidator(
    queryParams.vtr,
    config,
    queryParams.state,
    queryParams.redirect_uri
  );

  if (includedPrompts.includes("select_account")) {
    throw new AuthoriseRequestError({
      errorCode: "unmet_authentication_requirements",
      errorDescription: "Unmet authentication requirements",
      httpStatusCode: 302,
      state: queryParams.state,
      redirectUri: queryParams.redirect_uri,
    });
  }

  return {
    response_type: queryParams.response_type,
    redirect_uri: queryParams.redirect_uri,
    state: queryParams.state,
    nonce: queryParams.nonce,
    client_id: queryParams.client_id,
    scope: scopes,
    claims: parsedClaims,
    vtr: parsedVtrSet,
    prompt: includedPrompts,
    ui_locales: uiLocales,
  };
};

const isEmptyRequest = (queryParams: Request["query"]): boolean => {
  return JSON.stringify(queryParams) === "{}";
};

const isValidUri = (uri: string): boolean => {
  try {
    new URL(uri);
    return true;
  } catch (error) {
    logger.error("Error parsing redirect_uri: " + (error as Error).message);
    return false;
  }
};

const parsePrompts = (
  prompt: string | undefined,
  clientId: string,
  redirectUri: string | undefined
): string[] => {
  if (!prompt) {
    logger.info("No prompt value included in authorisation request");
    return [];
  }
  //Prompt is space delimited string https://openid.net/specs/openid-connect-core-1_0-17.html#AuthorizationExamples:~:text=OPTIONAL.%20Space%20delimited
  const includedPrompts = prompt.split(" ");

  const invalidPrompts = includedPrompts.filter(
    (prompt) => !VALID_OIDC_PROMPTS.includes(prompt)
  );

  if (invalidPrompts.length !== 0) {
    logger.warn(
      `Invalid prompts included in authorisation request: "${invalidPrompts}"`
    );

    throw new ParseAuthRequestError(
      "Invalid Request: Invalid prompt parameter",
      clientId,
      redirectUri
    );
  }

  return includedPrompts;
};

const isResponseTypeValid = (responseType: string): boolean =>
  responseType.split(" ").every((rt) => VALID_OIDC_RESPONSE_TYPES.includes(rt));

const parseClaims = (
  claims: string | undefined,
  clientId: string,
  redirectUri: string
): string[] => {
  if (!claims) {
    logger.info("No claims in authorisation request");
    return [];
  }
  try {
    const parsedClaimSet = JSON.parse(claims);

    if (!parsedClaimSet.userinfo) {
      logger.info("No userinfo claims included in authorisation request");
      return [];
    }

    return Object.keys(parsedClaimSet.userinfo);
  } catch (error) {
    logger.error("Error parsing claims: " + (error as Error).message);
    throw new ParseAuthRequestError(
      "Invalid JSON in claims",
      clientId,
      redirectUri
    );
  }
};

const parseUiLocales = (uiLocales: string | undefined): string[] => {
  if (!uiLocales) {
    logger.info("No ui locales included in authorisation request");
    return [];
  }

  const includedUiLocales = uiLocales.split(" ");

  const unsupportedLocales = includedUiLocales.filter(
    (uiLocale) => !SUPPORTED_UI_LOCALES.includes(uiLocale)
  );

  if (unsupportedLocales.length !== 0) {
    logger.error("Unsupported ui locales included in authorisation request");
  }

  return includedUiLocales;
};
