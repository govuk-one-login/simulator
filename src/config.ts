import AuthRequestParameters from "./types/auth-request-parameters";

export class Config {
  private static instance: Config;

  // Client Configuration

  private clientId: string;
  private publicKey: string;
  private scopes: string[];
  private redirectUrls: string[];
  private claims: string[];
  private identityVerificationSupported: boolean;
  private idTokenSigningAlgorithm: string;
  private clientLoCs: string[];

  // Response Configuration

  private sub: string;
  private email: string;
  private emailVerified: boolean;
  private phoneNumber: string;
  private phoneNumberVerified: boolean;

  // Authorisation Request Parameters Storage

  private authCodeRequestParamsStore: Record<string, AuthRequestParameters>;

  private constructor() {
    const defaultPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmXXR3EsRvUMVhEJMtQ1w
exJjfQ00Q0MQ7ARfShN53BnOQEPFnS/I8ntBddkKdE3q+vMTI72w6Fv3SsMM+ciR
2LIHdEQfKgsLt6PGNcV1kG6GG/3nSW3psW8w65Q3fmy81P1748qezDrVfaGrF4PD
XALzX1ph+nz8mpKmck6aY6LEUJ4B+TIfYzlKmmwFe3ri0spSW+J5wE9mmT3VkR2y
SuHRYHQlxlF9dfX7ltOTsbgJFzN6TO01ZQDhY0iLwzdGwhSxO6R6N/ZINYHCKFPa
QD+tdKsrw7QDIYnx0IiXFnkGnizl3UtqSmXAaceTvPM2Pz84x2JiwHrp2Sml6RYL
CQIDAQAB
-----END PUBLIC KEY-----
`;

    this.clientId = process.env.CLIENT_ID || "HGIOgho9HIRhgoepdIOPFdIUWgewi0jw";
    this.publicKey = process.env.PUBLIC_KEY || defaultPublicKey;
    this.scopes = process.env.SCOPES
      ? process.env.SCOPES.split(",")
      : ["openid", "email", "password"];
    this.redirectUrls = process.env.REDIRECT_URLS
      ? process.env.REDIRECT_URLS.split(",")
      : ["http://localhost:8080/authorization-code/callback"];
    this.claims = process.env.CLAIMS
      ? process.env.CLAIMS.split(",")
      : ["https://vocab.account.gov.uk/v1/coreIdentityJWT"];
    this.identityVerificationSupported =
      process.env.IDENTITY_VERIFICATION_SUPPORTED !== "false";
    this.idTokenSigningAlgorithm =
      process.env.ID_TOKEN_SIGNING_ALGORITHM || "ES256";
    this.clientLoCs = process.env.CLIENT_LOCS
      ? process.env.CLIENT_LOCS.split(",")
      : ["P0", "P2"];

    this.sub =
      process.env.SUB ||
      "urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=";
    this.email = process.env.EMAIL || "john.smith@gmail.com";
    this.emailVerified = process.env.EMAIL_VERIFIED !== "false";
    this.phoneNumber = process.env.PHONE_NUMBER || "07123456789";
    this.phoneNumberVerified = process.env.PHONE_NUMBER_VERIFIED !== "false";

    this.authCodeRequestParamsStore = {};
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public static resetInstance(): void {
    Config.instance = new Config();
  }

  public getClientId(): string {
    return this.clientId;
  }

  public setClientId(clientId: string): void {
    this.clientId = clientId;
  }

  public getPublicKey(): string {
    return this.publicKey;
  }

  public setPublicKey(publicKey: string): void {
    this.publicKey = publicKey;
  }

  public getScopes(): string[] {
    return this.scopes;
  }

  public setScopes(scopes: string[]): void {
    this.scopes = scopes;
  }

  public getRedirectUrls(): string[] {
    return this.redirectUrls;
  }

  public setRedirectUrls(redirectUrls: string[]): void {
    this.redirectUrls = redirectUrls;
  }

  public getClaims(): string[] {
    return this.claims;
  }

  public setClaims(claims: string[]): void {
    this.claims = claims;
  }

  public getIdentityVerificationSupported(): boolean {
    return this.identityVerificationSupported;
  }

  public setIdentityVerificationSupported(
    identityVerificationSupported: boolean
  ): void {
    this.identityVerificationSupported = identityVerificationSupported;
  }

  public getIdTokenSigningAlgorithm(): string {
    return this.idTokenSigningAlgorithm;
  }

  public setIdTokenSigningAlgorithm(idTokenSigningAlgorithm: string): void {
    this.idTokenSigningAlgorithm = idTokenSigningAlgorithm;
  }

  public getClientLoCs(): string[] {
    return this.clientLoCs;
  }

  public setClientLoCs(clientLoCs: string[]): void {
    this.clientLoCs = clientLoCs;
  }

  public getSub(): string {
    return this.sub;
  }

  public setSub(sub: string): void {
    this.sub = sub;
  }

  public getEmail(): string {
    return this.email;
  }

  public setEmail(email: string): void {
    this.email = email;
  }

  public getEmailVerified(): boolean {
    return this.emailVerified;
  }

  public setEmailVerified(emailVerified: boolean): void {
    this.emailVerified = emailVerified;
  }

  public getPhoneNumber(): string {
    return this.phoneNumber;
  }

  public setPhoneNumber(phoneNumber: string): void {
    this.phoneNumber = phoneNumber;
  }

  public getPhoneNumberVerified(): boolean {
    return this.phoneNumberVerified;
  }

  public setPhoneNumberVerified(phoneNumberVerified: boolean): void {
    this.phoneNumberVerified = phoneNumberVerified;
  }

  public getAuthCodeRequestParams(authCode: string): AuthRequestParameters {
    return this.authCodeRequestParamsStore[authCode];
  }

  public addToAuthCodeRequestParamsStore(
    authCode: string,
    authRequestParameters: AuthRequestParameters
  ): void {
    this.authCodeRequestParamsStore[authCode] = authRequestParameters;
  }

  public deleteFromAuthCodeRequestParamsStore(authCode: string): void {
    delete this.authCodeRequestParamsStore[authCode];
  }
}
