export type AccessTokenClaims = {
  exp: number;
  iat: number;
  iss: string;
  jti: string;
  client_id: string;
  sub: string;
  sid: string;
  scope: string[];
  claims?: string[] | null;
};
