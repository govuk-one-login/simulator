export default interface ClientConfiguration {
  clientId: string;
  publicKey: string;
  scopes: string[];
  redirectUrls: string[];
  claims: string[];
  identityVerificationSupported: boolean;
  idTokenSigningAlgorithm: string;
  clientLoCs: string[];
}
