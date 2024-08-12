import { Config } from "../../../src/config";
import { jest } from "@jest/globals";
import { createOidcClientFromConfig } from "../../../src/helper/create-oidc-client-from-config";
import { exportJWK } from "jose";
import { createPublicKey } from "crypto";

jest.spyOn(Config.getInstance(), "getClientId").mockReturnValue("clientId");
jest.spyOn(Config.getInstance(), "getClientName").mockReturnValue("clientName");

jest.spyOn(Config.getInstance(), "getScopes").mockReturnValue(["openid"]);
jest
  .spyOn(Config.getInstance(), "getRedirectUrls")
  .mockReturnValue(["http://localhost:3000/some-callback"]);
jest
  .spyOn(Config.getInstance(), "getClaims")
  .mockReturnValue(["https://vocab.account.gov.uk/v1/coreIdentityJWT"]);
jest
  .spyOn(Config.getInstance(), "getIdentityVerificationSupported")
  .mockReturnValue(true);
jest
  .spyOn(Config.getInstance(), "getIdTokenSigningAlgorithm")
  .mockReturnValue("ES256");
jest.spyOn(Config.getInstance(), "getClientLoCs").mockReturnValue(["P2", "P0"]);

describe("CreateOidcClientFromConfigTest", () => {
  it("sets up the client metadata from the config values", async () => {
    const config = Config.getInstance();
    const expectedJwk = await exportJWK(
      createPublicKey({
        key: config.getPublicKey(),
        format: "pem",
      })
    );
    const client = await createOidcClientFromConfig(config);
    expect(client).toStrictEqual({
      client_id: "clientId",
      client_name: "clientName",
      application_type: "web",
      scope: ["openid"].join(" "),
      token_endpoint_auth_method: "private_key_jwt",
      id_token_signed_response_alg: "ES256",
      claims: ["https://vocab.account.gov.uk/v1/coreIdentityJWT"],
      vtr: ["P2", "P0"],
      id_verification_supported: true,
      redirect_uris: ["http://localhost:3000/some-callback"],
      jwks: {
        keys: [expectedJwk],
      },
    });
  });
});
