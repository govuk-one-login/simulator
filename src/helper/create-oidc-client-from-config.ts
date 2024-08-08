import { ClientMetadata, SigningAlgorithm } from "oidc-provider";
import { Config } from "../config.js";
import { exportJWK } from "jose";
import { createPublicKey } from "crypto";

export const createOidcClientFromConfig = async (
  config: Config
): Promise<ClientMetadata> => {
  const publicKey = config.getPublicKey();

  const jwk = await exportJWK(createPublicKey(publicKey));
  return {
    client_id: config.getClientId(),
    redirect_uris: config.getRedirectUrls(),
    application_type: "web",
    client_name: config.getClientName(),
    scope: config.getScopes().join(" "),
    id_token_signed_response_alg:
      config.getIdTokenSigningAlgorithm() as SigningAlgorithm,
    token_endpoint_auth_method: "private_key_jwt", //Hardcoded for now as we don't yet support client_secret_post
    claims: config.getClaims(),
    vtr: config.getClientLoCs(),
    id_verification_supported: config.getIdentityVerificationSupported(),
    jwks: {
      keys: [jwk],
    },
  };
};
