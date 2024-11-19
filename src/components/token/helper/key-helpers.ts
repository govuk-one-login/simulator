import { exportJWK, importPKCS8, type JSONWebKeySet, JWK, KeyLike } from "jose";
import { createPrivateKey, createPublicKey } from "node:crypto";
import {
  EC_PRIVATE_TOKEN_SIGNING_KEY_ID,
  EC_PRIVATE_TOKEN_SIGNING_KEY,
  RSA_PRIVATE_TOKEN_SIGNING_KEY_ID,
  RSA_PRIVATE_TOKEN_SIGNING_KEY,
  EC_PRIVATE_IDENTITY_SIGNING_KEY,
} from "../../../constants";
import { Buffer } from "node:buffer";

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
    return EC_PRIVATE_TOKEN_SIGNING_KEY_ID;
  } else {
    return RSA_PRIVATE_TOKEN_SIGNING_KEY_ID;
  }
};

export const generateJWKS = async (): Promise<JSONWebKeySet> => {
  const ecPubJwk = await publicJwkWithKidFromPrivateKey(
    EC_PRIVATE_TOKEN_SIGNING_KEY,
    EC_PRIVATE_TOKEN_SIGNING_KEY_ID
  );

  const rsPubJwk = await publicJwkWithKidFromPrivateKey(
    RSA_PRIVATE_TOKEN_SIGNING_KEY,
    RSA_PRIVATE_TOKEN_SIGNING_KEY_ID
  );
  return {
    keys: [ecPubJwk, rsPubJwk],
  };
};

export const generateDidJwks = async (): Promise<JWK> => {
  const didPublicJwk = await publicJwkFromPrivateKey(
    EC_PRIVATE_IDENTITY_SIGNING_KEY
  );
  didPublicJwk.alg = "ES256";

  return didPublicJwk;
};

async function publicJwkFromPrivateKey(privateKeyString: string): Promise<JWK> {
  const privateKey = createPrivateKey({
    key: Buffer.from(
      privateKeyString.replace(/-----(?:BEGIN|END) PRIVATE KEY-----|\s/g, ""),
      "base64"
    ),
    type: "pkcs8",
    format: "der",
  });
  const publicKey = createPublicKey(privateKey);
  return await exportJWK(publicKey);
}

export async function publicJwkWithKidFromPrivateKey(
  privateKeyString: string,
  kid: string
): Promise<JWK> {
  const jwk = await publicJwkFromPrivateKey(privateKeyString);
  jwk.kid = kid;
  return jwk;
}
