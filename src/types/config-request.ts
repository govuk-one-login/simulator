export default interface ConfigRequest {
  clientId: string;
  publicKey: string;
  scopes: string[];
  redirectUrls: string[];
  claims: string[];
  identityVerificationSupported: boolean;
  idTokenSigningAlgorithm: string;
  clientLoCs: string[];
  sub: string;
  email: string;
  emailVerified: boolean;
  phoneNumber: string;
  phoneNumberVerified: boolean;
}
