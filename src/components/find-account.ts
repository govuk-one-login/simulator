import {
  AccessToken,
  AuthorizationCode,
  BackchannelAuthenticationRequest,
  DeviceCode,
  KoaContextWithOIDC,
} from "oidc-provider";
export const findAccount = (
  _ctx: KoaContextWithOIDC,
  sub: string,
  _token:
    | AuthorizationCode
    | AccessToken
    | DeviceCode
    | BackchannelAuthenticationRequest
    | undefined
) => {
  //TODO: ATO-884 - Implement properly when implementing token endpoint
  return {
    accountId: sub,
    async claims() {
      return { sub };
    },
  };
};
