import { importPKCS8, KeyLike } from "jose";
import {
  EC_KEY_ID,
  EC_PRIVATE_TOKEN_SIGNING_KEY,
  RSA_KEY_ID,
  RSA_PRIVATE_TOKEN_SIGNING_KEY,
} from "../../../constants";

export const getTokenSigningKey = (
  tokenSigningAlgorithm: string
): Promise<KeyLike> => {
  if (tokenSigningAlgorithm === "ES256") {
    return importPKCS8(EC_PRIVATE_TOKEN_SIGNING_KEY, "EC");
  } else {
    return importPKCS8(RSA_PRIVATE_TOKEN_SIGNING_KEY, "RSA");
  }
};

export const getKeyId = (tokenSigningAlgorithm: string): string => {
  if (tokenSigningAlgorithm === "ES256") {
    return EC_KEY_ID;
  } else {
    return RSA_KEY_ID;
  }
};
