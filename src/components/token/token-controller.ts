import { Request, Response } from "express";
import { logger } from "../../logger";
import { Config } from "../../config";
import { createAccessToken } from "./helper/create-access-token";
import { createIdToken } from "./helper/create-id-token";
import { TokenRequestError } from "../../errors/token-request-error";
import { ParseTokenRequestError } from "../../errors/parse-token-request-error";
import { parseTokenRequest } from "../../parse/parse-token-request";
import ResponseConfiguration from "src/types/response-configuration";
import { comparePKCECodeChallengeAndVerifier } from "./helper/code-challenge-comparer";
import { ACCESS_TOKEN_EXPIRY } from "../../constants";

export const tokenController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const config = Config.getInstance();

    const parsedTokenRequest = await parseTokenRequest(req.body, config);

    const authCodeParams = config.getAuthCodeRequestParams(
      parsedTokenRequest.tokenRequest.code
    );

    if (!authCodeParams) {
      logger.warn(
        { code: parsedTokenRequest.tokenRequest.code },
        "Could not find auth code params for provided auth code"
      );
      throw new TokenRequestError({
        errorCode: "invalid_grant",
        errorDescription: "Invalid grant",
        httpStatusCode: 400,
      });
    }

    if (
      authCodeParams.redirectUri !== parsedTokenRequest.tokenRequest.redirectUri
    ) {
      logger.warn(
        {
          authCodeRedirect: authCodeParams.redirectUri,
          tokenRequestRedirect: parsedTokenRequest.tokenRequest.redirectUri,
        },
        "Mismatch in redirect uri between auth code params and token request"
      );
      throw new TokenRequestError({
        errorCode: "invalid_grant",
        errorDescription: "Invalid grant",
        httpStatusCode: 400,
      });
    }

    const accessToken = await createAccessToken(authCodeParams);

    const idToken = await createIdToken(authCodeParams, accessToken);

    if (config.isInteractiveModeEnabled()) {
      config.addToResponseConfigurationStore(
        accessToken,
        authCodeParams.responseConfiguration as ResponseConfiguration
      );
    } else {
      config.addToAccessTokenStore(
        `${config.getClientId()}.${config.getSub()}`,
        accessToken
      );
    }

    if (config.isPKCEEnabled()) {
      comparePKCECodeChallengeAndVerifier(
        authCodeParams.code_challenge,
        parsedTokenRequest.tokenRequest.code_verifier
      );
    }

    res.status(200).json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: ACCESS_TOKEN_EXPIRY,
      id_token: idToken,
    });

    return;
  } catch (error) {
    logger.error("Token Request Error: " + (error as Error).message);

    if (error instanceof TokenRequestError) {
      handleTokenRequestError(error, res);
      return;
    } else if (error instanceof ParseTokenRequestError) {
      res.status(400).json({
        error: "invalid_request",
        error_description: "Invalid private_key_jwt",
      });
      return;
    } else {
      res.status(500).json({
        error: "server_error",
      });
      return;
    }
  }
};

const handleTokenRequestError = (error: TokenRequestError, res: Response) => {
  res.status(error.httpStatusCode).json({
    error: error.errorCode,
    error_description: error.errorDescription,
  });
};
