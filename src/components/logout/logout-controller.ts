import { Request, Response } from "express";
import { decodeJwt, decodeProtectedHeader, jwtVerify } from "jose";
import { Config } from "../../config";
import { logger } from "../../logger";
import { generateJWKS } from "../token/helper/key-helpers";

export const logoutController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const queryParams = req.query;
  logger.info("Logout request received");
  const config = Config.getInstance();

  const defaultLogoutUrl = "https://gov.uk";

  if (Object.keys(queryParams).length === 0) {
    return res.redirect(defaultLogoutUrl);
  }

  const idTokenHint = queryParams.id_token_hint as string | undefined;
  const stateParam = queryParams.state as string | undefined;

  if (!idTokenHint) {
    logger.info("No Id token hint attached, redirecting to default url");
    return res.redirect(buildRedirectUri(defaultLogoutUrl, stateParam));
  }

  if (!(await isIdTokenSignatureValid(idTokenHint))) {
    return res.redirect(
      buildRedirectUri(defaultLogoutUrl, stateParam, {
        error_code: "invalid_request",
        error_description: "unable to validate id_token_hint",
      })
    );
  }

  let parsedIdToken: {
    clientId: string | undefined;
    clientSessionId: string | undefined;
    rpPairwiseId: string | undefined;
  };

  try {
    parsedIdToken = parseIdTokenHint(idTokenHint);
  } catch (error) {
    // This error is very unlikely to be hit here and is just as unlikley to be hit in
    // the actual code as we need to first parse the id token hint before
    // validating it's signature
    // https://github.com/govuk-one-login/authentication-api/blob/37642c85a403a5e42bbec9b621aaed079b03c78f/oidc-api/src/main/java/uk/gov/di/authentication/oidc/entity/LogoutRequest.java#L84-L87
    logger.warn("Failed to parse Id Token hint: " + (error as Error).message);

    return res.redirect(
      buildRedirectUri(defaultLogoutUrl, stateParam, {
        error_code: "invalid_request",
        error_description: "invalid id_token_hint",
      })
    );
  }

  if (!parsedIdToken.clientId || !parsedIdToken.rpPairwiseId) {
    logger.info(
      "No client ID or subject claim, redirecting to default logout URI"
    );
    return res.redirect(buildRedirectUri(defaultLogoutUrl, stateParam));
  }

  if (parsedIdToken.clientId !== config.getClientId()) {
    logger.info("Client not found, redirecting with error");
    return res.redirect(
      buildRedirectUri(defaultLogoutUrl, stateParam, {
        error_code: "unauthorized_client",
        error_description: "client not found",
      })
    );
  }

  if (!queryParams.post_logout_redirect_uri) {
    logger.info(
      "No post_logout_redirect_uri, redirecting to default logout URI"
    );
    return res.redirect(buildRedirectUri(defaultLogoutUrl, stateParam));
  }

  if (
    !config
      .getPostLogoutRedirectUrls()
      .includes(queryParams.post_logout_redirect_uri as string)
  ) {
    logger.info(
      "Post logout redirect uri not present in client config: " +
        queryParams.post_logout_redirect_uri
    );
    return res.redirect(
      buildRedirectUri(defaultLogoutUrl, stateParam, {
        error_code: "invalid_request",
        error_description:
          "client registry does not contain post_logout_redirect_uri",
      })
    );
  }

  if (!isValidUrl(queryParams.post_logout_redirect_uri as string)) {
    return res.redirect(
      buildRedirectUri(defaultLogoutUrl, stateParam, {
        error_code: "invalid_request",
        error_description: "invalid post logout redirect URI",
      })
    );
  }

  res.redirect(
    buildRedirectUri(queryParams.post_logout_redirect_uri as string, stateParam)
  );
};

const isIdTokenSignatureValid = async (idToken: string): Promise<boolean> => {
  const header = decodeProtectedHeader(idToken);
  // This is akin to calling SignedJWT.parse in the real code
  // at this point we don't actually need to parse it
  // just check that parsing it doesn't throw an error
  decodeJwt(idToken);

  let { keys } = await generateJWKS();

  if (header.alg === "RS256") {
    keys = keys.filter((k) => k.alg === "RS256");
  } else {
    keys = keys.filter((k) => k.alg === "ES256");
  }

  const signatureValidationResult = await Promise.allSettled(
    keys.map((k) => {
      return jwtVerify(idToken, k, {
        currentDate: new Date(0),
      });
    })
  );

  if (signatureValidationResult.every((r) => r.status === "rejected")) {
    logger.error(
      "Failed to verify signature of ID token: " +
        signatureValidationResult[0].reason
    );
    return false;
  }

  return true;
};

const parseIdTokenHint = (
  idTokenHint: string
): {
  clientId: string | undefined;
  clientSessionId: string | undefined;
  rpPairwiseId: string | undefined;
} => {
  const jwtClaimsSet = decodeJwt(idTokenHint);

  return {
    clientId: Array.isArray(jwtClaimsSet.aud)
      ? jwtClaimsSet.aud[0]
      : jwtClaimsSet.aud,
    clientSessionId: jwtClaimsSet.sid as string | undefined,
    rpPairwiseId: jwtClaimsSet.sub,
  };
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    logger.error(
      `Post logout redirect uri is not valid url: ${url} error: ${(error as Error).message}`
    );
    return false;
  }
};
const buildRedirectUri = (
  baseurl: string,
  state: string | undefined,
  errorOpts?: { error_code: string; error_description: string }
): string => {
  const queryParams = { ...errorOpts, ...(state && { state }) };
  return `${baseurl}?${new URLSearchParams(queryParams).toString()}`;
};
