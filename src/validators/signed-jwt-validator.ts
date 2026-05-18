import { createLocalJWKSet, jwtVerify } from "jose";
import { logger } from "../logger.js";
import type { JWTPayload } from "jose";
import { generateJWKS } from "../components/token/helper/key-helpers.js";
import { Config } from "../config.js";

export const signedJwtValidator = async <PayloadType = JWTPayload>(
  token: string
): Promise<
  | {
      valid: true;
      payload: PayloadType;
    }
  | { valid: false }
> => {
  try {
    const jwks = createLocalJWKSet(await generateJWKS());
    const config = Config.getInstance();
    const { payload } = await jwtVerify<PayloadType>(token, jwks, {
      issuer: config.getIssuerValue(),
    });

    return {
      valid: true,
      payload: payload,
    };
  } catch (error) {
    logger.error(`Error validating signature: ${(error as Error).message}`);
    return { valid: false };
  }
};
