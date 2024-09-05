import AuthRequestParameters from "./types/auth-request-parameters";
import ClientConfiguration from "./types/client-configuration";
import ResponseConfiguration from "./types/response-configuration";

export class Config {
  private static instance: Config;

  private clientConfiguration: ClientConfiguration;
  private responseConfiguration: ResponseConfiguration;
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
    this.clientConfiguration = {
      clientId: process.env.CLIENT_ID ?? "HGIOgho9HIRhgoepdIOPFdIUWgewi0jw",
      publicKey: process.env.PUBLIC_KEY ?? defaultPublicKey,
      scopes: process.env.SCOPES
        ? process.env.SCOPES.split(",")
        : ["openid", "email", "phone"],
      redirectUrls: process.env.REDIRECT_URLS
        ? process.env.REDIRECT_URLS.split(",")
        : ["http://localhost:8080/oidc/authorization-code/callback"],
      claims: process.env.CLAIMS
        ? process.env.CLAIMS.split(",")
        : ["https://vocab.account.gov.uk/v1/coreIdentityJWT"],
      identityVerificationSupported:
        process.env.IDENTITY_VERIFICATION_SUPPORTED !== "false",
      idTokenSigningAlgorithm:
        process.env.ID_TOKEN_SIGNING_ALGORITHM ?? "ES256",
      clientLoCs: process.env.CLIENT_LOCS
        ? process.env.CLIENT_LOCS.split(",")
        : ["P0", "P2"],
    };

    this.responseConfiguration = {
      sub:
        process.env.SUB ??
        "urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=",
      email: process.env.EMAIL ?? "john.smith@gmail.com",
      emailVerified: process.env.EMAIL_VERIFIED !== "false",
      phoneNumber: process.env.PHONE_NUMBER || "07123456789",
      phoneNumberVerified: process.env.PHONE_NUMBER_VERIFIED !== "false",
    };

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
    return this.clientConfiguration.clientId;
  }

  public setClientId(clientId: string): void {
    this.clientConfiguration.clientId = clientId;
  }

  public getPublicKey(): string {
    return this.clientConfiguration.publicKey;
  }

  public setPublicKey(publicKey: string): void {
    this.clientConfiguration.publicKey = publicKey;
  }

  public getScopes(): string[] {
    return this.clientConfiguration.scopes;
  }

  public setScopes(scopes: string[]): void {
    this.clientConfiguration.scopes = scopes;
  }

  public getRedirectUrls(): string[] {
    return this.clientConfiguration.redirectUrls;
  }

  public setRedirectUrls(redirectUrls: string[]): void {
    this.clientConfiguration.redirectUrls = redirectUrls;
  }

  public getClaims(): string[] {
    return this.clientConfiguration.claims;
  }

  public setClaims(claims: string[]): void {
    this.clientConfiguration.claims = claims;
  }

  public getIdentityVerificationSupported(): boolean {
    return this.clientConfiguration.identityVerificationSupported;
  }

  public setIdentityVerificationSupported(
    identityVerificationSupported: boolean
  ): void {
    this.clientConfiguration.identityVerificationSupported =
      identityVerificationSupported;
  }

  public getIdTokenSigningAlgorithm(): string {
    return this.clientConfiguration.idTokenSigningAlgorithm;
  }

  public setIdTokenSigningAlgorithm(idTokenSigningAlgorithm: string): void {
    this.clientConfiguration.idTokenSigningAlgorithm = idTokenSigningAlgorithm;
  }

  public getClientLoCs(): string[] {
    return this.clientConfiguration.clientLoCs;
  }

  public setClientLoCs(clientLoCs: string[]): void {
    this.clientConfiguration.clientLoCs = clientLoCs;
  }

  public getSub(): string {
    return this.responseConfiguration.sub;
  }

  public setSub(sub: string): void {
    this.responseConfiguration.sub = sub;
  }

  public getEmail(): string {
    return this.responseConfiguration.email;
  }

  public setEmail(email: string): void {
    this.responseConfiguration.email = email;
  }

  public getEmailVerified(): boolean {
    return this.responseConfiguration.emailVerified;
  }

  public setEmailVerified(emailVerified: boolean): void {
    this.responseConfiguration.emailVerified = emailVerified;
  }

  public getPhoneNumber(): string {
    return this.responseConfiguration.phoneNumber;
  }

  public setPhoneNumber(phoneNumber: string): void {
    this.responseConfiguration.phoneNumber = phoneNumber;
  }

  public getPhoneNumberVerified(): boolean {
    return this.responseConfiguration.phoneNumberVerified;
  }

  public setPhoneNumberVerified(phoneNumberVerified: boolean): void {
    this.responseConfiguration.phoneNumberVerified = phoneNumberVerified;
  }

  public getAuthCodeRequestParams(
    authCode: string
  ): AuthRequestParameters | undefined {
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
