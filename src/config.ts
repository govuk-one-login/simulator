import {
  AccessTokenStore,
  AccessTokenStoreKey,
} from "./types/access-token-store";
import AuthRequestParameters from "./types/auth-request-parameters";
import ClientConfiguration from "./types/client-configuration";
import ResponseConfiguration from "./types/response-configuration";
import { ErrorConfiguration } from "./types/error-configuration";
import { isCoreIdentityError } from "./validators/core-identity-error";
import { isIdTokenError } from "./validators/id-token-error";
import { CoreIdentityError } from "./types/core-identity-error";
import { IdTokenError } from "./types/id-token-error";
import { isAuthoriseError } from "./validators/authorise-errors";
import { AuthoriseError } from "./types/authorise-errors";
import ReturnCode from "./types/return-code";
import { UserIdentityClaim } from "./types/user-info";
import { ResponseConfigurationStore } from "./types/response-configuration-store";
import {
  isValidTokenAuthMethod,
  TokenAuthMethod,
} from "./validators/token-auth-method-validator";
import { logger } from "./logger";
import { JWK } from "jose";

export class Config {
  private static instance: Config;

  private clientConfiguration: ClientConfiguration;
  private responseConfiguration: ResponseConfiguration;
  private errorConfiguration: ErrorConfiguration;
  private authCodeRequestParamsStore: Record<string, AuthRequestParameters>;
  private signingJwksCache: Record<string, JWK>;
  private accessTokenStore: AccessTokenStore;
  private responseConfigurationStore: ResponseConfigurationStore;

  private simulatorUrl: string;
  private readonly interactiveMode: boolean;
  private readonly pkceEnabled: boolean;
  private publishSecondaryIdTokenSigningKeys: boolean;
  private useSecondaryIdTokenSigningKeys: boolean;

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
      publicKeySource: process.env.PUBLIC_KEY_SOURCE ?? "STATIC",
      publicKey: process.env.PUBLIC_KEY ?? defaultPublicKey,
      jwksUrl: process.env.JWKS_URL,
      scopes: process.env.SCOPES
        ? process.env.SCOPES.split(",")
        : ["openid", "email", "phone"],
      redirectUrls: process.env.REDIRECT_URLS
        ? process.env.REDIRECT_URLS.split(",")
        : ["http://localhost:8080/oidc/authorization-code/callback"],
      postLogoutRedirectUrls: process.env.POST_LOGOUT_REDIRECT_URLS
        ? process.env.POST_LOGOUT_REDIRECT_URLS.split(",")
        : ["http://localhost:8080/signed-out"],
      claims: process.env.CLAIMS
        ? (process.env.CLAIMS.split(",") as UserIdentityClaim[])
        : [
            "https://vocab.account.gov.uk/v1/coreIdentityJWT",
            "https://vocab.account.gov.uk/v1/address",
            "https://vocab.account.gov.uk/v1/returnCode",
          ],
      identityVerificationSupported:
        process.env.IDENTITY_VERIFICATION_SUPPORTED !== "false",
      idTokenSigningAlgorithm:
        process.env.ID_TOKEN_SIGNING_ALGORITHM ?? "ES256",
      clientLoCs: process.env.CLIENT_LOCS
        ? process.env.CLIENT_LOCS.split(",")
        : ["P0", "P2"],
      token_auth_method: isValidTokenAuthMethod(
        process.env.TOKEN_AUTH_METHOD ?? ""
      )
        ? (process.env.TOKEN_AUTH_METHOD as TokenAuthMethod)
        : "private_key_jwt",
      client_secret_hash: process.env.CLIENT_SECRET_HASH,
    };

    this.responseConfiguration = {
      sub:
        process.env.SUB ??
        "urn:fdc:gov.uk:2022:56P4CMsGh_02YOlWpd8PAOI-2sVlB2nsNU7mcLZYhYw=",
      email: process.env.EMAIL ?? "test@example.com",
      emailVerified: process.env.EMAIL_VERIFIED !== "false",
      phoneNumber: process.env.PHONE_NUMBER ?? "07123456789",
      phoneNumberVerified: process.env.PHONE_NUMBER_VERIFIED !== "false",
      maxLoCAchieved: "P2",
      coreIdentityVerifiableCredentials: {
        type: ["VerifiableCredential", "IdentityCheckCredential"],
        credentialSubject: {
          name: [
            {
              nameParts: [
                {
                  value: "GEOFFREY",
                  type: "GivenName",
                },
                {
                  value: "HEARNSHAW",
                  type: "FamilyName",
                },
              ],
            },
          ],
          birthDate: [
            {
              value: "1955-04-19",
            },
          ],
        },
      },
      passportDetails: null,
      drivingPermitDetails: null,
      postalAddressDetails: [
        {
          addressCountry: "GB",
          buildingName: "",
          streetName: "FRAMPTON ROAD",
          postalCode: "GL1 5QB",
          buildingNumber: "26",
          addressLocality: "GLOUCESTER",
          validFrom: "2000-01-01",
          uprn: 100120472196,
          subBuildingName: "",
        },
      ],
      returnCodes: [],
    };

    this.errorConfiguration = {
      coreIdentityErrors:
        process.env.CORE_IDENTITY_ERRORS?.split(",").filter(
          isCoreIdentityError
        ) ?? [],
      idTokenErrors:
        process.env.ID_TOKEN_ERRORS?.split(",").filter(isIdTokenError) ?? [],
      authoriseErrors:
        process.env.AUTHORISE_ERRORS?.split(",").filter(isAuthoriseError) ?? [],
    };

    this.authCodeRequestParamsStore = {};
    this.accessTokenStore = {};
    this.responseConfigurationStore = {};
    this.signingJwksCache = {};

    this.simulatorUrl = process.env.SIMULATOR_URL ?? "http://localhost:3000";
    this.interactiveMode = process.env.INTERACTIVE_MODE === "true";
    this.pkceEnabled = process.env.PKCE_ENABLED === "true";
    this.publishSecondaryIdTokenSigningKeys =
      process.env.PUBLISH_NEW_ID_TOKEN_SIGNING_KEYS === "true";
    this.useSecondaryIdTokenSigningKeys =
      this.isPublishNewIdTokenSigningKeysEnabled() &&
      process.env.USE_NEW_ID_TOKEN_SIGNING_KEYS === "true";

    if (
      this.getTokenAuthMethod() === "client_secret_post" &&
      this.getIdentityVerificationSupported()
    ) {
      logger.error(
        "Clients configured with client_secret_post cannot support identity verification. For more information see our documentation here: https://docs.sign-in.service.gov.uk/before-integrating/integrating-third-party-platform/#set-up-client-secret-using-client-secret-post"
      );
      throw new Error(
        "Clients configured with client_secret_post cannot support identity verification."
      );
    }
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

  public getClientConfiguration(): ClientConfiguration {
    return this.clientConfiguration;
  }

  public getClientId(): string {
    return this.clientConfiguration.clientId!;
  }

  public setClientId(clientId: string): void {
    this.clientConfiguration.clientId = clientId;
  }

  public getPublicKey(): string {
    return this.clientConfiguration.publicKey!;
  }

  public setPublicKey(publicKey: string): void {
    this.clientConfiguration.publicKey = publicKey;
  }

  public getPublicKeySource(): string {
    return this.clientConfiguration.publicKeySource;
  }

  public setPublicKeySource(publicKeySource: string): void {
    this.clientConfiguration.publicKeySource = publicKeySource;
  }

  public getJwksUrl(): string | undefined {
    return this.clientConfiguration.jwksUrl;
  }

  public setJwksUrl(jwksUrl: string): void {
    this.clientConfiguration.jwksUrl = jwksUrl;
  }

  public getScopes(): string[] {
    return this.clientConfiguration.scopes!;
  }

  public setScopes(scopes: string[]): void {
    this.clientConfiguration.scopes = scopes;
  }

  public getRedirectUrls(): string[] {
    return this.clientConfiguration.redirectUrls!;
  }

  public setRedirectUrls(redirectUrls: string[]): void {
    this.clientConfiguration.redirectUrls = redirectUrls;
  }

  public getPostLogoutRedirectUrls(): string[] {
    return this.clientConfiguration.postLogoutRedirectUrls as string[];
  }

  public setPostLogoutRedirectUrls(postLogoutRedirectUrls: string[]): void {
    this.clientConfiguration.postLogoutRedirectUrls = postLogoutRedirectUrls;
  }

  public getClaims(): UserIdentityClaim[] {
    return this.clientConfiguration.claims!;
  }

  public setClaims(claims: UserIdentityClaim[]): void {
    this.clientConfiguration.claims = claims;
  }

  public getIdentityVerificationSupported(): boolean {
    return this.clientConfiguration.identityVerificationSupported!;
  }

  public setIdentityVerificationSupported(
    identityVerificationSupported: boolean
  ): void {
    this.clientConfiguration.identityVerificationSupported =
      identityVerificationSupported;
  }

  public getIdTokenSigningAlgorithm(): string {
    return this.clientConfiguration.idTokenSigningAlgorithm!;
  }

  public setIdTokenSigningAlgorithm(idTokenSigningAlgorithm: string): void {
    this.clientConfiguration.idTokenSigningAlgorithm = idTokenSigningAlgorithm;
  }

  public getClientLoCs(): string[] {
    return this.clientConfiguration.clientLoCs!;
  }

  public setClientLoCs(clientLoCs: string[]): void {
    this.clientConfiguration.clientLoCs = clientLoCs;
  }

  public getTokenAuthMethod(): TokenAuthMethod {
    return this.clientConfiguration.token_auth_method;
  }

  public getClientSecretHash(): string {
    return this.clientConfiguration.client_secret_hash!;
  }

  public getResponseConfiguration(): ResponseConfiguration {
    return this.responseConfiguration;
  }

  public getSub(): string {
    return this.responseConfiguration.sub!;
  }

  public setSub(sub: string): void {
    this.responseConfiguration.sub = sub;
  }

  public getEmail(): string {
    return this.responseConfiguration.email!;
  }

  public setEmail(email: string): void {
    this.responseConfiguration.email = email;
  }

  public getEmailVerified(): boolean {
    return this.responseConfiguration.emailVerified!;
  }

  public setEmailVerified(emailVerified: boolean): void {
    this.responseConfiguration.emailVerified = emailVerified;
  }

  public getPhoneNumber(): string {
    return this.responseConfiguration.phoneNumber!;
  }

  public setPhoneNumber(phoneNumber: string): void {
    this.responseConfiguration.phoneNumber = phoneNumber;
  }

  public getPhoneNumberVerified(): boolean {
    return this.responseConfiguration.phoneNumberVerified!;
  }

  public setPhoneNumberVerified(phoneNumberVerified: boolean): void {
    this.responseConfiguration.phoneNumberVerified = phoneNumberVerified;
  }

  public getMaxLoCAchieved(): string {
    return this.responseConfiguration.maxLoCAchieved!;
  }

  public setMaxLoCAchieved(maxLoCAchieved: string): void {
    this.responseConfiguration.maxLoCAchieved = maxLoCAchieved;
  }

  public getVerifiableIdentityCredentials(): object | null {
    return this.responseConfiguration.coreIdentityVerifiableCredentials!;
  }

  public setVerifiableIdentityCredentials(
    coreIdentityVerifiableCredentials: object | null
  ): void {
    this.responseConfiguration.coreIdentityVerifiableCredentials =
      coreIdentityVerifiableCredentials;
  }

  public getPassportDetails(): object[] | null {
    return this.responseConfiguration.passportDetails!;
  }

  public setPassportDetails(passportDetails: object[] | null): void {
    this.responseConfiguration.passportDetails = passportDetails;
  }

  public getDrivingPermitDetails(): object[] | null {
    return this.responseConfiguration.drivingPermitDetails!;
  }

  public setDrivingPermitDetails(drivingPermitDetails: object[] | null): void {
    this.responseConfiguration.drivingPermitDetails = drivingPermitDetails;
  }

  public getPostalAddressDetails(): object[] | null {
    return this.responseConfiguration.postalAddressDetails!;
  }

  public setPostalAddressDetails(postalAddressDetails: object[] | null): void {
    this.responseConfiguration.postalAddressDetails = postalAddressDetails;
  }

  public getReturnCodes(): ReturnCode[] | null {
    return this.responseConfiguration.returnCodes!;
  }

  public setReturnCodes(returnCodes: ReturnCode[] | null): void {
    this.responseConfiguration.returnCodes = returnCodes;
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

  public getAccessTokensFromStore(
    clientIdSub: AccessTokenStoreKey
  ): string[] | undefined {
    return this.accessTokenStore[clientIdSub];
  }

  public addToAccessTokenStore(
    clientIdSub: AccessTokenStoreKey,
    accessToken: string
  ): void {
    this.accessTokenStore[clientIdSub] = [
      ...(this.accessTokenStore[clientIdSub] ?? []),
      accessToken,
    ];
  }

  public getResponseConfigurationForAccessToken(
    accessToken: string
  ): ResponseConfiguration | undefined {
    return this.responseConfigurationStore[accessToken];
  }

  public addToResponseConfigurationStore(
    accessToken: string,
    responseConfiguration: ResponseConfiguration
  ): void {
    this.responseConfigurationStore[accessToken] = responseConfiguration;
  }

  public getErrorConfiguration(): ErrorConfiguration {
    return this.errorConfiguration;
  }

  public getCoreIdentityErrors(): CoreIdentityError[] {
    return this.errorConfiguration.coreIdentityErrors!;
  }

  public setCoreIdentityErrors(coreIdentityErrors: CoreIdentityError[]): void {
    this.errorConfiguration.coreIdentityErrors = coreIdentityErrors;
  }

  public getIdTokenErrors(): IdTokenError[] {
    return this.errorConfiguration.idTokenErrors!;
  }

  public setIdTokenErrors(idTokenErrors: IdTokenError[]): void {
    this.errorConfiguration.idTokenErrors = idTokenErrors;
  }

  public getAuthoriseErrors(): AuthoriseError[] {
    return this.errorConfiguration.authoriseErrors!;
  }

  public setAuthoriseErrors(authoriseErrors: AuthoriseError[]): void {
    this.errorConfiguration.authoriseErrors = authoriseErrors;
  }

  public getSimulatorUrl(): string {
    return this.simulatorUrl;
  }

  public setSimulatorUrl(simulatorUrl: string): void {
    this.simulatorUrl = simulatorUrl;
  }

  public getIssuerValue(): string {
    return `${this.simulatorUrl}/`;
  }

  public getExpectedPrivateKeyJwtAudiences(): string[] {
    return [`${this.simulatorUrl}/token`, this.getIssuerValue()];
  }

  public getTrustmarkUrl(): string {
    return `${this.simulatorUrl}/trustmark`;
  }

  public getDidController(): string {
    return `did:web:${new URL(this.simulatorUrl).host.replace(":", encodeURIComponent(":"))}`;
  }

  public isInteractiveModeEnabled(): boolean {
    return this.interactiveMode;
  }

  public isPKCEEnabled(): boolean {
    return this.pkceEnabled;
  }

  public isPublishNewIdTokenSigningKeysEnabled(): boolean {
    return this.publishSecondaryIdTokenSigningKeys;
  }

  public setPublishNewIdTokenSigningKeysEnabled(publishNewKeys: boolean): void {
    this.publishSecondaryIdTokenSigningKeys = publishNewKeys;
  }

  public isUseNewIdTokenSigningKeysEnabled(): boolean {
    return this.useSecondaryIdTokenSigningKeys;
  }

  public setUseNewIdTokenSigningKeysEnabled(useNewKeys: boolean): void {
    this.useSecondaryIdTokenSigningKeys = useNewKeys;
  }
}
