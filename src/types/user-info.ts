import ReturnCode from "./return-code";

export interface UserInfo extends UserIdentity {
  sub: string;
  email?: string;
  email_verified?: boolean;
  phone_number?: string;
  phone_number_verified?: boolean;
}

export interface UserIdentity {
  "https://vocab.account.gov.uk/v1/passport"?: object[];
  "https://vocab.account.gov.uk/v1/address"?: object[];
  "https://vocab.account.gov.uk/v1/drivingPermit"?: object[];
  "https://vocab.account.gov.uk/v1/coreIdentityJWT"?: string;
  "https://vocab.account.gov.uk/v1/returnCode"?: ReturnCode[];
}

export type UserIdentityClaim = keyof UserIdentity;

export type UserScope = "openid" | "email" | "phone";
