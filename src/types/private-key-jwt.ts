import { ProtectedHeaderParameters } from "jose";

export type PrivateKeyJwt = {
  header: ClientAssertionHeader;
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

export interface ClientAssertionHeader extends ProtectedHeaderParameters {
  alg: string;
}
