export default interface AuthRequestParameters {
  redirectUri: string;
  nonce: string;
  scopes: string[];
  claims: string[];
  vtr: {
    credentialTrust: "Cl" | "Cl.Cm";
    levelOfConfidence?: "P0" | "P2";
  };
}
