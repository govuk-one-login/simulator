import { Request, Response } from "express";
import { logger } from "../../logger";
import { parseAuthRequest } from "../../parse/parse-auth-request";
import { AuthoriseRequestError } from "../../errors/authorise-request-error";
import { BadRequestError } from "../../errors/bad-request-error";
import { ParseAuthRequestError } from "../../errors/parse-auth-request-error";
import { Config } from "../../config";
import { MissingParameterError } from "../../errors/missing-parameter-error";
import { base64url } from "jose";
import { randomBytes } from "crypto";
import { validateAuthRequestQueryParams } from "../../validators/validate-auth-request-query-params";
import { MethodNotAllowedError } from "../../errors/method-not-allowed-error";
import { VectorOfTrust } from "../../types/vector-of-trust";
import { validateAuthRequestObject } from "../../validators/validate-auth-request-object";
import { transformRequestObject } from "../../utils/utils";
import { TrustChainValidationError } from "../../errors/trust-chain-validation-error";
import { renderResponseConfigFrom } from "../utils/form/render-response-config-form";

export const authoriseController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const config = Config.getInstance();

  try {
    let parsedAuthRequest;

    if (req.method === "GET") {
      parsedAuthRequest = parseAuthRequest(
        //We can safely cast this type as our middleware will handle
        //any duplicate query params
        req.query as Record<string, string>
      );
    } else {
      throw new MethodNotAllowedError(req.method);
    }

    if (parsedAuthRequest.client_id !== config.getClientId()) {
      logger.warn("No Client found for ClientID");
      throw new BadRequestError(
        `No Client found for ClientID: ${parsedAuthRequest.client_id}`
      );
    }

    if (!parsedAuthRequest.requestObject) {
      logger.info("Validating request query params");
      validateAuthRequestQueryParams(parsedAuthRequest, config);
    } else {
      logger.info("Validating request object");
      await validateAuthRequestObject(parsedAuthRequest, config);
      parsedAuthRequest = transformRequestObject(
        parsedAuthRequest.requestObject
      );
    }

    if (parsedAuthRequest.prompt.includes("select_account")) {
      throw new AuthoriseRequestError({
        errorCode: "unmet_authentication_requirements",
        errorDescription: "Unmet authentication requirements",
        httpStatusCode: 302,
        state: parsedAuthRequest.state,
        redirectUri: parsedAuthRequest.redirect_uri,
      });
    }

    if (config.getAuthoriseErrors().includes("ACCESS_DENIED")) {
      logger.warn("Client configured to return access_denied error response");
      throw new AuthoriseRequestError({
        errorCode: "access_denied",
        errorDescription:
          "Access denied by resource owner or authorization server",
        httpStatusCode: 302,
        redirectUri: parsedAuthRequest.redirect_uri,
        state: parsedAuthRequest.state,
      });
    }

    const authCode = generateAuthCode();

    if (config.isInteractiveModeEnabled()) {
      res.send(renderResponseConfigFrom(authCode));
      return;
    }

    config.addToAuthCodeRequestParamsStore(authCode, {
      claims: parsedAuthRequest.claims,
      nonce: parsedAuthRequest.nonce,
      redirectUri: parsedAuthRequest.redirect_uri,
      scopes: parsedAuthRequest.scope,
      vtr: (parsedAuthRequest.vtr as VectorOfTrust[])[0],
    });

    res.redirect(
      `${parsedAuthRequest.redirect_uri}?code=${authCode}&state=${parsedAuthRequest.state}`
    );
    return;
  } catch (error) {
    logger.error("Authorise request error: " + (error as Error).message);
    handleRequestError(error, res, config);
    return;
  }
};

const generateAuthCode = (): string => base64url.encode(randomBytes(32));

const handleRequestError = (
  error: unknown,
  res: Response,
  config: Config
): void => {
  if (error instanceof AuthoriseRequestError) {
    res.redirect(
      `${error.redirectUri}?error=${error.errorCode}&error_description=${encodeURIComponent(error.errorDescription)}${error.state ? `&state=${error.state}` : ""}`
    );
  } else if (error instanceof MissingParameterError) {
    res.status(400).send("Request is missing parameters");
  } else if (error instanceof ParseAuthRequestError) {
    if (
      error.clientId !== config.getClientId() ||
      !config.getRedirectUrls().includes(error.redirectUri as string)
    ) {
      logger.warn(
        `Redirect URI ${error.redirectUri} is not valid for client: ${error.clientId}`
      );
      res.status(400).send("Invalid Request");
    } else {
      res.redirect(
        `${error.redirectUri}?error=invalid_request&error_description=${encodeURIComponent("Invalid Request")}`
      );
    }
  } else if (error instanceof BadRequestError) {
    res.status(400).send("Invalid Request");
  } else if (error instanceof MethodNotAllowedError) {
    res.status(405).send(error.message);
  } else if (error instanceof TrustChainValidationError) {
    res.status(400).send(error.message);
  } else {
    logger.error("Unknown error occurred: " + (error as Error).message);
    logger.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
