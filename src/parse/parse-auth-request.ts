import { SUPPORTED_UI_LOCALES, VALID_OIDC_RESPONSE_TYPES } from "../constants";
import { ParseAuthRequestError } from "../errors/parse-auth-request-error";
import { logger } from "../logger";
import { Request } from "express";
import { MissingParameterError } from "../errors/missing-parameter-error";
import {
  base64url,
  decodeJwt,
  decodeProtectedHeader,
  JWTPayload,
  ProtectedHeaderParameters,
} from "jose";
import { VectorOfTrust } from "../types/vector-of-trust";
import { isValidUri, parsePrompts } from "../utils/utils";

export type RequestObject = {
  header: ProtectedHeaderParameters;
  payload: JWTPayload;
  encodedJwt: string;
};

export type AuthRequest = {
  response_type: string;
  redirect_uri: string;
  client_id: string;
  state: string;
  nonce: string;
  scope: string[];
  claims: string[];
  vtr: string | VectorOfTrust[];
  prompt: string[];
  ui_locales: string[];
  max_age: number;
  request_uri?: string;
  requestObject?: RequestObject;
};

export const parseAuthRequest = (
  authRequest: Record<string, string>
): AuthRequest => {
  // Validate core OAuth2.0 authorization request params
  if (isEmptyRequest(authRequest)) {
    throw new MissingParameterError(
      "Invalid Request: No Query parameters present in request"
    );
  }

  if (!authRequest.client_id) {
    throw new MissingParameterError(
      "Invalid Request: Missing client_id parameter"
    );
  }

  if (authRequest.redirect_uri && !isValidUri(authRequest.redirect_uri)) {
    throw new MissingParameterError(
      "Invalid Request: Invalid redirect_uri parameter"
    );
  }

  if (
    authRequest.response_type &&
    !isResponseTypeValid(authRequest.response_type)
  ) {
    throw new ParseAuthRequestError(
      "Invalid Request: Invalid response_type parameter",
      authRequest.client_id,
      authRequest.redirect_uri
    );
  }

  if (authRequest.request_uri && !isValidUri(authRequest.request_uri)) {
    throw new ParseAuthRequestError(
      "Invalid Request: Invalid request_uri parameter",
      authRequest.client_id,
      authRequest.redirect_uri
    );
  }

  const requestObject = parseRequestObject(authRequest);

  if (
    !authRequest.response_type &&
    !requestObject &&
    !authRequest.request_uri
  ) {
    throw new ParseAuthRequestError(
      "Missing response_type parameter",
      authRequest.client_id,
      authRequest.redirect_uri
    );
  }

  const includedPrompts = parsePrompts(
    authRequest.prompt,
    authRequest.client_id,
    authRequest.redirect_uri
  );

  // now in AuthenticationRequest.parse() line 2142
  if (!requestObject) {
    checkMandatoryTopLevelParams(authRequest);
  }

  if (!isResponseTypeValid(authRequest.response_type)) {
    throw new ParseAuthRequestError(
      "Invalid Request: Unsupported response_type parameter: " +
        authRequest.response_type,
      authRequest.client_id,
      authRequest.redirect_uri
    );
  }

  //Scopes are space-delim https://datatracker.ietf.org/doc/html/rfc6749#section-3.3:~:text=The%20value%20of%20the%20scope%20parameter%20is%20expressed%20as%20a%20list%20of%20space%2D%0A%20%20%20delimited%2C%20case%2Dsensitive%20strings
  const scopes = authRequest.scope?.split(" ");

  if (scopes && !scopes.includes("openid")) {
    throw new ParseAuthRequestError(
      "Invalid Request: The scope must include an openid value",
      authRequest.client_id,
      authRequest.redirect_uri
    );
  }

  const max_age = parseMaxAge(authRequest);

  const uiLocales = parseUiLocales(authRequest.ui_locales);

  const parsedClaims = parseClaims(
    authRequest.claims,
    authRequest.client_id,
    authRequest.redirect_uri
  );

  return {
    response_type: authRequest.response_type,
    redirect_uri: authRequest.redirect_uri,
    state: authRequest.state,
    nonce: authRequest.nonce,
    client_id: authRequest.client_id,
    scope: scopes,
    claims: parsedClaims,
    vtr: authRequest.vtr,
    prompt: includedPrompts,
    ui_locales: uiLocales,
    max_age,
    request_uri: authRequest.request_uri,
    requestObject,
  };
};

const isEmptyRequest = (queryParams: Request["query"]): boolean => {
  return JSON.stringify(queryParams) === "{}";
};

const isResponseTypeValid = (responseType: string): boolean =>
  responseType.split(" ").every((rt) => VALID_OIDC_RESPONSE_TYPES.includes(rt));

const checkMandatoryTopLevelParams = (authRequest: Record<string, string>) => {
  if (!authRequest.redirect_uri) {
    throw new MissingParameterError(
      "Invalid Request: Missing redirect_uri parameter"
    );
  }

  if (!authRequest.scope) {
    throw new ParseAuthRequestError(
      "Invalid Request: Missing scope parameter",
      authRequest.client_id,
      authRequest.redirect_uri
    );
  }
};

const parseClaims = (
  claims: string | undefined,
  clientId: string,
  redirectUri?: string
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

const parseRequestObject = (
  authRequest: Record<string, string>
): RequestObject | undefined => {
  if (authRequest.request) {
    if (authRequest.request_uri) {
      throw new ParseAuthRequestError(
        "Invalid request: Found mutually exclusive request and request_uri parameters",
        authRequest.client_id,
        authRequest.redirect_uri
      );
    }

    try {
      const requestObject = decodeRequestObject(authRequest.request);

      if (authRequest.client_id === requestObject.payload.sub) {
        throw new ParseAuthRequestError(
          "The JWT sub (subject) claim must not equal the client_id"
        );
      }
      return requestObject;
    } catch (error) {
      throw new ParseAuthRequestError(
        "Invalid request parameter: " + (error as Error).message,
        authRequest.client_id,
        authRequest.redirect_uri
      );
    }
  }
  return undefined;
};
const decodeRequestObject = (
  request: string
): {
  header: ProtectedHeaderParameters;
  payload: JWTPayload;
  encodedJwt: string;
} => {
  const indexOfDot = request.indexOf(".");

  if (indexOfDot === -1) {
    throw new ParseAuthRequestError(
      "Invalid JWT serialization: Missing dot delimiter"
    );
  }

  const encodedHeader = base64url.decode(request.substring(0, indexOfDot));
  let header: Record<string, string | undefined>;

  try {
    header = JSON.parse(Buffer.from(encodedHeader).toString());
  } catch (error) {
    logger.error("Invalid JWT header: " + (error as Error).message);
    throw new ParseAuthRequestError("Invalid JWT header: Failed to parse JSON");
  }

  if (!header.alg) {
    throw new ParseAuthRequestError(
      "Invalid JWT header: Missing alg in header"
    );
  }

  //This code only supports plain or signed JWTs
  return {
    header: decodeProtectedHeader(request),
    payload: decodeJwt(request),
    encodedJwt: request,
  };
};
const parseMaxAge = (authRequest: Record<string, string>) => {
  let max_age = -1;
  if (authRequest.max_age) {
    const parsedMaxAge = parseInt(authRequest.max_age);

    if (Number.isNaN(parsedMaxAge)) {
      throw new ParseAuthRequestError("Invalid max_age parameter");
    } else {
      max_age = parsedMaxAge;
    }
  }
  return max_age;
};
