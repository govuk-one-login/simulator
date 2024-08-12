import Provider, {
  Configuration,
  interactionPolicy,
  KoaContextWithOIDC,
} from "oidc-provider";
import { Config } from "./config.js";
import { createOidcClientFromConfig } from "./helper/create-oidc-client-from-config.js";
import { claimsValidator } from "./validators/claims-validator.js";
import { vtrValidator } from "./validators/vtr-validator.js";
import {
  EC_PRIVATE_KEY_JWK,
  ISSUER_VALUE,
  RSA_PRIVATE_KEY_JWK,
  VALID_SCOPES,
} from "./constants/provider-config.js";
import { errorRender } from "./error/error-render.js";
import { findAccount } from "./components/find-account.js";
import { scopeValidator } from "./validators/scope-validator.js";

const { base } = interactionPolicy;

const baseInteractions = base();
//We do not use a consent prompt so this can be removed
baseInteractions.remove("consent");

const createOidcProvider = async (): Promise<Provider> => {
  const clientConfig = Config.getInstance();

  const config: Configuration = {
    features: {
      claimsParameter: {
        enabled: true,
        assertClaimsParameter: claimsValidator,
      },
      backchannelLogout: { enabled: true },
      userinfo: { enabled: true },
      pushedAuthorizationRequests: { enabled: false },
      registration: {
        enabled: false,
      },
      devInteractions: { enabled: false },
    },
    extraParams: {
      vtr: vtrValidator,
      scope: scopeValidator,
    },
    routes: {
      authorization: "/authorize",
      token: "/token",
      userinfo: "/userinfo",
      end_session: "/logout",
      jwks: "/.well-known/jwks.json",
    },
    responseTypes: ["code"],
    claims: {
      email: ["email", "email_verified"],
      phone: ["phone_number", "phone_number_verified"],
      openid: ["sub"],
      wallet_subject_id: ["sub"],
      "https://vocab.account.gov.uk/v1/passport": null,
      "https://vocab.account.gov.uk/v1/socialSecurityRecord": null,
      "https://vocab.account.gov.uk/v1/coreIdentityJWT": null,
      "https://vocab.account.gov.uk/v1/address": null,
      "https://vocab.account.gov.uk/v1/inheritedIdentityJWT": null,
      "https://vocab.account.gov.uk/v1/drivingPermit": null,
    },
    scopes: VALID_SCOPES,
    subjectTypes: ["public", "pairwise"],
    clientAuthMethods: ["private_key_jwt"],
    clientDefaults: {
      token_endpoint_auth_method: "private_key_jwt",
      scope: "openid",
      backchannel_logout_session_required: false,
      response_types: ["code"],
      identity_verification_supported: false,
    },
    enabledJWA: {
      idTokenSigningAlgValues: ["RS256", "ES256"],
      clientAuthSigningAlgValues: [
        "RS256",
        "RS384",
        "RS512",
        "PS256",
        "PS384",
        "PS512",
      ],
    },
    allowOmittingSingleRegisteredRedirectUri: false,
    clients: [await createOidcClientFromConfig(clientConfig)],
    pkce: {
      required: () => false,
    },
    discovery: {
      ui_locales_supported: ["en", "cy"],
      service_documentation: "https://docs.sign-in.service.gov.uk/",
      op_policy_uri: "https://signin.integration.account.gov.uk/privacy-notice",
      op_tos_uri:
        "https://signin.integration.account.gov.uk/terms-and-conditions",
      trustmarks: "https://oidc.integration.account.gov.uk/trustmark",
    },
    renderError: errorRender,
    findAccount: findAccount,
    loadExistingGrant: async (ctx: KoaContextWithOIDC) => {
      const { oidc } = ctx;
      //adapted from https://github.com/panva/node-oidc-provider/blob/main/recipes/skip_consent.md
      const grantId =
        oidc.result?.consent?.grantId ||
        oidc?.session?.grantIdFor(oidc.client?.clientId as string);

      if (grantId) {
        const grant = await ctx.oidc.provider.Grant.find(grantId);

        if (
          grant &&
          grant.exp &&
          oidc.account &&
          grant.exp < (oidc.session?.exp as number)
        ) {
          grant.exp = oidc.session?.exp;

          await grant.save();
        }

        return grant;
      } else {
        const grant = new ctx.oidc.provider.Grant({
          clientId: oidc.client?.clientId,
          accountId: oidc.session?.accountId,
        });

        const claims = oidc.claims.userinfo;
        const scopes = (oidc.params?.scope as string).split(" ");

        scopes.forEach((scope) => grant.addOIDCScope(scope));

        if (claims) {
          grant.addOIDCClaims(Object.keys(claims));
        }

        await grant.save();
        return grant;
      }
    },
    interactions: {
      policy: [...baseInteractions],
    },
    cookies: {
      keys: ["some secret key"],
    },
    jwks: {
      //These are required to enable the idTokenSigningAlgValues
      // we have chose above.
      keys: [RSA_PRIVATE_KEY_JWK, EC_PRIVATE_KEY_JWK],
    },
  };

  return new Provider(ISSUER_VALUE, config);
};

export { createOidcProvider };
