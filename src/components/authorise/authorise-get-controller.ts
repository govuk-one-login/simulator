import { Request, Response } from "express";
import { logger } from "../../logger";
import { parseAuthQueryParams } from "../../parse/parse-auth-request-query-params";
import { AuthoriseRequestError } from "../../errors/authorise-request-error";
import { BadRequestError } from "../../errors/bad-request-error";
import { ParseAuthRequestError } from "../../errors/parse-auth-request-error";
import { Config } from "../../config";
import { MissingParameterError } from "../../errors/missing-parameter-error";

export const authoriseGetController = (req: Request, res: Response): void => {
  const config = Config.getInstance();

  try {
    const parsedAuthRequestParams = parseAuthQueryParams(
      //We can safely cast this type as our middleware will handle
      //any duplicate query params
      req.query as Record<string, string | undefined>,
      config
    );

    const authCode = generateAuthCode();

    config.addToAuthCodeRequestParamsStore(authCode, {
      claims: parsedAuthRequestParams.claims,
      nonce: parsedAuthRequestParams.nonce,
      redirectUri: parsedAuthRequestParams.redirect_uri,
      scopes: parsedAuthRequestParams.scope,
      vtr: parsedAuthRequestParams.vtr[0],
    });

    res.redirect(
      `${parsedAuthRequestParams.redirect_uri}?code=${authCode}&state=${parsedAuthRequestParams.state}`
    );
    return;
  } catch (error) {
    logger.error("Authorise request error: " + (error as Error).message);
    handleRequestError(error, res, config);
    return;
  }
};

//static auth code
const generateAuthCode = (): string => "c87fe9af6880180fbb73a77597395053";

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
  } else {
    logger.error("Unknown error occurred: " + (error as Error).message);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};