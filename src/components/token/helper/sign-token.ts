import { SignJWT } from "jose";
import { Config } from "../../../config";
import { getKeyId, getTokenSigningKey } from "./key-helpers";
import { logger } from "../../../logger";

export const signToken = async (
  claimSet: Record<string, unknown>
): Promise<string> => {
  const clientConfig = Config.getInstance();
  const tokenSigningAlgorithm = clientConfig.getIdTokenSigningAlgorithm();

  const privateKey = await getTokenSigningKey(tokenSigningAlgorithm);
  const kid = getKeyId(tokenSigningAlgorithm);

  const signedJWT = await new SignJWT(claimSet)
    .setProtectedHeader({
      alg: tokenSigningAlgorithm,
      kid,
    })
    .sign(privateKey);

  logger.info(
    `Created Signed JWT with signing algorithm: "${tokenSigningAlgorithm}" using keyId: ${kid}`
  );

  return signedJWT;
};
