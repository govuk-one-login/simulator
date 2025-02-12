import { createApp } from "../../src/app";
import request from "supertest";

describe("/.well-known/openid-configuration endpoint test", () => {
  it("returns the expected object", async () => {
    const app = createApp();
    const response = await request(app).get(
      "/.well-known/openid-configuration"
    );

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      authorization_endpoint: "http://localhost:3000/authorize",
      token_endpoint: "http://localhost:3000/token",
      issuer: "http://localhost:3000/",
      jwks_uri: "http://localhost:3000/.well-known/jwks.json",
      scopes_supported: ["openid", "email", "phone"],
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      token_endpoint_auth_methods_supported: [
        "private_key_jwt",
        "client_secret_post",
      ],
      token_endpoint_auth_signing_alg_values_supported: [
        "RS256",
        "RS384",
        "RS512",
        "PS256",
        "PS384",
        "PS512",
      ],
      ui_locales_supported: ["en", "cy"],
      service_documentation: "https://docs.sign-in.service.gov.uk/",
      op_policy_uri: "https://signin.account.gov.uk/privacy-notice",
      op_tos_uri: "https://signin.account.gov.uk/terms-and-conditions",
      request_parameter_supported: true,
      trustmarks: "http://localhost:3000/trustmark",
      subject_types_supported: ["public", "pairwise"],
      userinfo_endpoint: "http://localhost:3000/userinfo",
      end_session_endpoint: "http://localhost:3000/logout",
      id_token_signing_alg_values_supported: ["ES256", "RS256"],
      claim_types_supported: ["normal"],
      claims_supported: [
        "sub",
        "email",
        "email_verified",
        "phone_number",
        "phone_number_verified",
        "https://vocab.account.gov.uk/v1/passport",
        "https://vocab.account.gov.uk/v1/drivingPermit",
        "https://vocab.account.gov.uk/v1/coreIdentityJWT",
        "https://vocab.account.gov.uk/v1/address",
        "https://vocab.account.gov.uk/v1/returnCode",
      ],
      request_uri_parameter_supported: false,
    });
  });
});
