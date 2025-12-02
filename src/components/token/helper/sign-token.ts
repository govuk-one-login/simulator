import { SignJWT } from "jose";
import { Config } from "../../../config";
import { getTokenSigningKey } from "./key-helpers";
import { logger } from "../../../logger";

export const signToken = async (
  claimSet: Record<string, unknown>
): Promise<string> => {
  const config = Config.getInstance();
  const tokenSigningAlgorithm = config.getIdTokenSigningAlgorithm();

  const { key, keyId } = await getTokenSigningKey(
    tokenSigningAlgorithm,
    config
  );

  const signedJWT = await new SignJWT(claimSet)
    .setProtectedHeader({
      alg: tokenSigningAlgorithm,
      kid: keyId,
    })
    .sign(key);

  logger.info(
    `Created Signed JWT with signing algorithm: "${tokenSigningAlgorithm}" using keyId: ${keyId}`
  );

  return signedJWT;
};
