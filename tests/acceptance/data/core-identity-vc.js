const CORE_IDENTITY_VC_CLAIM = {
  type: ["VerifiableCredential", "IdentityCheckCredential"],
  credentialSubject: {
    name: [
      {
        nameParts: [
          {
            value: "KENNETH",
            type: "GivenName",
          },
          {
            value: "DECERQUEIRA",
            type: "FamilyName",
          },
        ],
      },
    ],
    birthDate: [
      {
        value: "1965-07-08",
      },
    ],
  },
};

module.exports = { CORE_IDENTITY_VC_CLAIM };
