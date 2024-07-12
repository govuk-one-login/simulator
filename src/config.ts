//TODO ATO-827: Remove the below line when the config class is used

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class Config {
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
    this.scopes = process.env.SCOPES || ["openid", "email", "password"];
    this.redirectUrls = process.env.REDIRECT_URLS || [
      "http://localhost:8080/authorization-code/callback",
    ];
    this.claims = process.env.CLAIMS || [
      "https://vocab.account.gov.uk/v1/coreIdentityJWT",
    ];
    this.identityVerificationSupported =
      process.env.IDENTITY_VERIFICATION_SUPPORTED || true;
    this.idTokenSigningAlgorithm =
      process.env.ID_TOKEN_SIGNING_ALGORITHM || "ES256";
    this.clientLoCs = process.env.CLIENT_LOCS || ["P0", "P2"];

    this.sub =
      process.env.SUB ||
      "urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=";
    this.email = process.env.EMAIL || "john.smith@gmail.com";
    this.emailVerified = process.env.EMAIL_VERIFIED || true;
    this.phoneNumber = process.env.PHONE_NUMBER || "07123456789";
    this.phoneNumberVerified = process.env.PHONE_NUMBER_VERIFIED || true;
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public getClientId(): string {
    return this.clientId;
  }

  public getPublicKey(): string {
    return this.publicKey;
  }

  public getScopes(): string[] {
    return this.scopes;
  }

  public getRedirectUrls(): string[] {
    return this.redirectUrls;
  }

  public getClaims(): string[] {
    return this.claims;
  }

  public getIdentityVerificationSupported(): boolean {
    return this.identityVerificationSupported;
  }

  public getIdTokenSigningAlgorithm(): string {
    return this.idTokenSigningAlgorithm;
  }

  public getClientLoCs(): string[] {
    return this.clientLoCs;
  }

  public getSub(): string {
    return this.sub;
  }

  public getEmail(): string {
    return this.email;
  }

  public getEmailVerified(): boolean {
    return this.identityVerificationSupported;
  }

  public getPhoneNumber(): string {
    return this.phoneNumber;
  }

  public getPhoneNumberVerified(): boolean {
    return this.phoneNumberVerified;
  }
}
