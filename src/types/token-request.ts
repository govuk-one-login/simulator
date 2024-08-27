export type TokenRequest = {
  grant_type: string;
  code: string;
  redirectUri: string;
  client_assertion_type: string;
  client_assertion: string;
  //We do not expect RPs to add this but it may be present
  client_id?: string;
};
