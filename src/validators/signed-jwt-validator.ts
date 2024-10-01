import { createLocalJWKSet, jwtVerify } from "jose";
import { logger } from "../logger";
import type { JWTPayload } from "jose/dist/types/types";
import { generateJWKS } from "../components/token/helper/key-helpers";
import { Config } from "../config";

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
    logger.error("Error validating signature", error);
    return { valid: false };
  }
};
