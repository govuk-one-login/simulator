import { VectorOfTrust } from "./vector-of-trust";

export default interface AuthRequestParameters {
  redirectUri: string;
  nonce: string;
  scopes: string[];
  claims: string[];
  vtr: VectorOfTrust;
}
