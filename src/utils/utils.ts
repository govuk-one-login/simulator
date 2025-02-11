import { AuthoriseRequestError } from "../errors/authorise-request-error";
import { SUPPORTED_UI_LOCALES, VALID_OIDC_PROMPTS } from "../constants";
import { logger } from "../logger";
import { AuthRequest, RequestObject } from "../parse/parse-auth-request";
import { VectorOfTrust } from "../types/vector-of-trust";
import { JWTPayload } from "jose";
import { ParseAuthRequestError } from "../errors/parse-auth-request-error";
import { Response } from "express";

export const isValidUri = (uri: string): boolean => {
  try {
    new URL(uri);
    return true;
  } catch (error) {
    logger.error("Error parsing redirect_uri: " + (error as Error).message);
    return false;
  }
};

export const getRequestObjectVtrAsString = (payload: JWTPayload): string => {
  if (
    Array.isArray(payload.vtr) &&
    payload.vtr.every((s) => typeof s === "string")
  ) {
    return JSON.stringify(payload.vtr);
  } else if (payload.vtr && typeof payload.vtr !== "string") {
    logger.error("Invalid vtr value");
    throw new AuthoriseRequestError({
      errorCode: "invalid_request",
      errorDescription: "Request vtr not valid",
      httpStatusCode: 302,
      redirectUri: payload.redirect_uri as string,
      state: payload.state as string,
    });
  }
  return payload.vtr as string;
};

export const parseUiLocales = (uiLocales: string | undefined): string[] => {
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

export const transformRequestObject = (
  requestObject: RequestObject
): AuthRequest => {
  const payload = requestObject.payload;
  const response_type = payload.response_type;
  const scope = (payload.scope as string).split(" ");
  if (!scope.includes("openid")) {
    throw new Error('Missing required scope: "openid"');
  }
  const client_id = payload.client_id;
  const redirect_uri = payload.redirect_uri;
  const state = payload.state;
  const claims = payload.claims ? getClaimsKeys(payload.claims as string) : [];
  const vtr = payload.vtr as VectorOfTrust[];
  const ui_locales = payload.ui_locales;
  let prompt = [];
  try {
    prompt = parsePrompts(
      payload.prompt as string,
      client_id as string,
      redirect_uri as string
    );
  } catch (error) {
    logger.error(error);
    throw new Error("Unknown prompt type in prompts: " + payload.prompt);
  }
  const nonce = payload.nonce;
  const max_age = payload.max_age;
  return {
    response_type,
    redirect_uri,
    state,
    nonce,
    client_id,
    scope,
    claims,
    vtr,
    prompt,
    ui_locales,
    max_age,
  } as AuthRequest;
};

export const getClaimsKeys = (claims: string): string[] => {
  const claimsJson = JSON.parse(claims);

  if (claimsJson.userinfo) {
    return Object.keys(claimsJson.userinfo);
  } else {
    return [];
  }
};
export const parseRequestObjectClaims = (claims: unknown): string[] => {
  //https://github.com/govuk-one-login/authentication-api/blob/278d31ef673b8c5d336b140a9bb7409363d56441/oidc-api/src/main/java/uk/gov/di/authentication/oidc/helpers/RequestObjectToAuthRequestHelper.java#L114
  if (typeof claims === "object" && !Array.isArray(claims)) {
    const claimsObject = claims as Record<string, object>;
    return claimsObject.userinfo ? Object.keys(claimsObject.userinfo) : [];
  } else if (typeof claims === "string") {
    return getClaimsKeys(claims);
  } else {
    throw new Error("Failed to parse OIDC claims");
  }
};

export const parsePrompts = (
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

export const redirectWithoutBody = (res: Response, location: string): void => {
  // res.redirect sends a non-configurable body which does not match the real system
  res.status(302);
  res.location(location);
  res.end();
};
