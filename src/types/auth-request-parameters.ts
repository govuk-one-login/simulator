export default interface AuthRequestParameters {
  redirectUri: string;
  nonce: string;
  scopes: string[];
  claims: string[];
}
