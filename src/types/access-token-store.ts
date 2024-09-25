export type AccessTokenStoreKey = `${string}.${string}`;

export type AccessTokenStore = {
  [clientIdSub: AccessTokenStoreKey]: string[];
};
