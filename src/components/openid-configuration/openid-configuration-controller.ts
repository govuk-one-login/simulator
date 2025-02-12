import { Request, Response } from "express";
import { Config } from "../../config";

export const openidConfigurationController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const config = Config.getInstance();

  res.header("Content-Type", "application/json");
  res.send(
    `{"authorization_endpoint":"${config.getSimulatorUrl()}/authorize","token_endpoint":"${config.getSimulatorUrl()}/token","issuer":"${config.getIssuerValue()}","jwks_uri":"${config.getSimulatorUrl()}/.well-known/jwks.json","scopes_supported":["openid","email","phone"],"response_types_supported":["code"],"grant_types_supported":["authorization_code"],"token_endpoint_auth_methods_supported":["private_key_jwt","client_secret_post"],"token_endpoint_auth_signing_alg_values_supported":["RS256","RS384","RS512","PS256","PS384","PS512"],"ui_locales_supported":["en","cy"],"service_documentation":"https://docs.sign-in.service.gov.uk/","op_policy_uri":"https://signin.account.gov.uk/privacy-notice","op_tos_uri":"https://signin.account.gov.uk/terms-and-conditions","request_parameter_supported":true,"trustmarks":"${config.getTrustmarkUrl()}","subject_types_supported":["public","pairwise"],"userinfo_endpoint":"${config.getSimulatorUrl()}/userinfo","end_session_endpoint":"${config.getSimulatorUrl()}/logout","id_token_signing_alg_values_supported":["ES256","RS256"],"claim_types_supported":["normal"],"claims_supported":["sub","email","email_verified","phone_number","phone_number_verified","https://vocab.account.gov.uk/v1/passport","https://vocab.account.gov.uk/v1/drivingPermit","https://vocab.account.gov.uk/v1/coreIdentityJWT","https://vocab.account.gov.uk/v1/address","https://vocab.account.gov.uk/v1/returnCode"],"request_uri_parameter_supported":false}`
  );
};
