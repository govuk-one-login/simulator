import ResponseConfiguration from "./response-configuration.js";
import { VectorOfTrust } from "./vector-of-trust.js";

export default interface AuthRequestParameters {
  redirectUri: string;
  nonce: string;
  scopes: string[];
  claims: string[];
  vtr: VectorOfTrust;
  responseConfiguration?: ResponseConfiguration;
  code_challenge?: string;
}
