export const ISSUER_VALUE = "https://oidc.test.account.gov.uk/";
export const VALID_CLAIMS = [
  "https://vocab.account.gov.uk/v1/passport",
  "https://vocab.account.gov.uk/v1/address",
  "https://vocab.account.gov.uk/v1/drivingPermit",
  "https://vocab.account.gov.uk/v1/socialSecurityRecord",
  "https://vocab.account.gov.uk/v1/coreIdentityJWT",
  "https://vocab.account.gov.uk/v1/returnCode",
  "https://vocab.account.gov.uk/v1/inheritedIdentityJWT",
];
export const VALID_SCOPES = ["openid", "email", "phone", "wallet_subject_id"];
export const VALID_CREDENTIAL_TRUST_VALUES = ["Cl", "Cl.Cm"];
export const DEFAULT_CREDENTIAL_TRUST = "Cl.Cm";
export const VALID_LOC_VALUES = ["P0", "P2"];

export const EC_PRIVATE_KEY_JWK = {
  kty: "EC",
  x: "vEiPKCtYEkeYYWEbfLsRSkbNWf9hxRvJ8YlJENZwNgw",
  y: "pYsHzWxBUW1kHDr18wASmJdJUrLbuxxHx5jwytK5lQw",
  crv: "P-256",
  d: "ZlFccFbm0htJDFHwLiS3xww4ogOnGTk_4LDNYYLNzF0",
};

export const RSA_PRIVATE_KEY_JWK = {
  kty: "RSA",
  n: "plAaRwQSfuqIW9laUDf5e3M6jLdcJ3TKh5DbKhuzI6JnhfyS4gwUnfsEQCmybpv0jFyKqBop2zr_10U3Ycl2eTAYD3GuP9pzKh-ICpQYPgyWamRPMTumD7O4RlB0yxvKZ-UT6GPVXH6ihY25fInjogIzEXDtVTpnaogPh6FkjqufpEOUZTBG4a5hfNOJ66pW9pSLyF80YUG7JtLB1Wrh1dpQrOtokHY5jgYxByJ0EJf6g-tn28nDr_AnDi44ZSmafyfHfxK8GsNFMj2sL3UPzP9dp_eb5yMBDLdz7ABdh57P2noJxOQAoNh7zSgfoWHZ3jcldvZuvKPdJ_ucXTUW-7I52nnkbjS7--JYUvZZBtTxuoyknA-ekE5CLWNyWjb0UaMv-XoNhALWNP2teRZSv2uRSBWI1S4TmQodY8ZjomAZYIHNF7xhee3aO58WoWkM2fwvU8UuUNrvddqdA_exP232Y7D2wK9PmSEqeK5BVwGYXIeSSZy1VPN7eZtCpaAdhvtOZo-MxGz9VdKpvg3x9kHpOGusnREZKEniMDJ9UpxEmpZmT4LJeh3Lrt9KIzmxJo7FYi0EqhERgQ9iwrcP2E-rLQcQz6_PzOVCLWlrQnW97QtSbUvFi77HggfYlS1SYm80RIIZ1k85ctsgt_hJsVvuKsTdbqoZwYPl8jPEJSc",
  e: "AQAB",
  d: "Qtm55kfNw3Q0gW75rXsCbkvgAgYGJdn9OsbQQbnGpRE3uZTP2crvUp0-lSftkCZiAzWDipSRtIyfoAEzhLv9QjNByJtyZjpBxnHMNixXHkHjCDrv1iNa2b7s2F6ow6eVEXP0L5pJfhds7nAMWfH3LPzjWCRjUbnbLegpDeSizfJQhi-f65ifNUHp78n8C115_T2yfkU-gcVxG-blgQqoYlSRzyAE9OSAuATnGi4QJ0dfrD0ojyEn5oWKvVl407kIYAo2V27Ja5yIKOy_VIgiZM1U8RpHcX4RgvIOx5NSBRyiAfjCCoF3ey_pe4qgRDdX4smZ5pqh4nOfht3NeW3IoZedjPZUForrEgjBOlZsc5Augl2jWkKH7KbLTT4EvnM3rzhOUSHcCOJkPHE6D50I_clR_U1vOKnLlYd3caFBlGPDHRZgavbzSDDEqDcU_fovoD6SLwYCv4Uim5-QG9n_4wuGH01a35JkTFgyCYtLirPG2LnIChiZWzbbhqHW0Ksx8aE5xE6ZnuFuOI18ZwReLuriv1ghn8j9aI0T-e-crfF6SeDYCod35G9ag9oEpD5h_7V-zrrwt2DAmUSagZxdnX9jSFvBrK7yALYl_F2K3qdUdGBE_C638C3hM8g5mXvf5LlozPs2Kf7dfa8Bm4bnEsompGN-MoU64X55h0hrc6E",
  p: "zpwhWI6gt1JY5Zac_Rv-yFe3Oub_xHtTD6Z6mUQitt7V2LWaa_itof-MNz5vjTssmr8vRjsR0tTNAnk6qvfQYzOqrYp6-k31eoM7LmP-vexpqf_VCYvZ109BDcQcLZVkbuItGHSE4-8HBFBz3Aq2Tj8n7fWr89UVPh2QpZhjQm2AtgP5i0frcmFgyYuvJzt7VIFfHM39yZd2-XZpVuWpuJgKvtRYJllF9BH3QtQPrYLcKHIt0Cw6eqgzl0SqW8IgJjYu-izdw-TfmgB6cM9G8YJrbFtl3PXdTLQUNf9BzmKPEf6TBkcdTHkTlTg4Xv-36BImJPM6vI5u_OCJmnOJtw",
  q: "zhHswM5nWqo9-I5UxK-OwNl3Q0N-6FVc1yHEU9raBhLf-S_ehg6_KuwRzWCPHhdwbjl66wig726Ttr1UQfrfOGyxrz1Xhhq3jog7p3xPvlLSeG5kwUX0Xf3mPRUfoLZ_LV0q6P24ZTusm9eVCEYFYB5bv2DGHnfwLLcsocQBwswDjsYmTie81dNl84tDfzvvHVGDyBT5umFxdmTFH00Wpu9DL4I6sRtRgkGo36L6__LL4vjfvb-fdCBq85YZnIw3hALRkicBGszVcdSDTyU3ra2vdpVW_KTCG1bnbQ9yoP7r6KDKgd3FHnjXu2K8QNcNjBAK8KVZ3NXNrfhv_qgAEQ",
  dp: "JIw31dt9EJCviwVmhduS6Uui7Pd53P7XxZf0bfJAlcq7V1dglqLpzBNRcWBJCVmjXUhei3TdhUcBcOOS_jVSFopIMeSiNm7d8qsOJ_mmUWBlnJ3VyJeFlHG_lzjOpz2bA4Zc5cuOymc4_YlhxVXbw-GmJZDktwBFfrRqJvDa9iA6uXfgh8PUIWqaXWypMi5ydZNhCM5ji2qQsDZDEg0URcQXeoRDh50ZI8Cd1aN_lnjkiv8PnZiFS7c_UQ3jeNHRMBE7pCOVoxZ0e2CESDpSWVxxtjxAu6J-YBgmzxp1QJXsqwk2ZtDjnOh6D1ZfmmZv2MyFFNo11K75cSAjF0BC5w",
  dq: "cFDEwbG-E2SGslqhSTKGlAXzQu4e1XLxTzBQWYQHIRhYivDUUCzpdPOGIHJojvYniWw62q-xR871I7y9l9isoYxcrC667ZTSRxVprjfLHuj1Xj6NG-qM7k3cl55TxryxRIBrSuI_Bq4nvikaSZAgjer-BqkwUpr8hOKxqNm0PAAGUGMfralq-wBlqQBWoZqBEXHEaeFE25kQxn7WEeFqX0I5VEOeybkiC-TNrlaeh7JF_ke3ayxuNFUW9fzxqKmj-IewwgAQUhMioxA5IYIffsITyIZNCxah1VTgfkjVKXrICdrZhT7imWEz9CY0hQKxl42G6PK2r-64VAH8yMe4gQ",
  qi: "igzlg0VHDwyPp_okzW3fuaq_Vk7AoYjEMeicIa1GS1jKlLLbwKB4yzznCBN5DPFF9kFQrHCyei5e8okBH_jXPkHArVkHmG9AmrcnAnb56nLWxu2YTpkIo8J40AFxzBJlDDYLRnp3OMrwxZUAjYMJ_RAO7DOOM5WRKh_QNjZLonCr09Dq6Vzxa0k29yR2sILy4uRq4aL8vCoBaQxeTnj9KnW2_fClH-SyBYsRxXviH8V0c26jzbEDZnJ9JNVlZycLmMPxbmsh-eAsnck0B2OWViNXDtPfiYjS09V_8JkYCA4yTSf-v9CgmG-cdaFIx_lwq8M0TgGv3BUeAjZnlVv9Ng",
};
