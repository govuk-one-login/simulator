import { JWSHeaderParameters } from "jose";

export type PrivateKeyJwt = {
  header: JWSHeaderParameters;
  payload: ClientAssertionClaims;
  signature: string;
  clientId: string;
  token: string;
};

type ClientAssertionClaims = {
  exp: number;
  iss: string;
  sub: string;
  aud: string | string[];
  //ATO-944: Update validation to match JTI checking
  jti?: string;
  iat?: number;
};
