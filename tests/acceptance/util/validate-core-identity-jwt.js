const { strictEqual, deepStrictEqual } = require("assert");
const { CORE_IDENTITY_VC_CLAIM } = require("../data/core-identity-vc");
const jose = require("jose");

const decodeJwtPart = (part) =>
  JSON.parse(Buffer.from(part, "base64url").toString());

const fetchDidKey = async (url, kid) => {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Failed to fetch DID key for url: " + url);
  }

  const jsonRespose = await res.json();

  const matchedKey = jsonRespose.assertionMethod?.find((key) => key.id == kid);

  if (!matchedKey) {
    throw new Error(
      `Failed to find matching key for URL: ${url} and KeyId: ${kid}`
    );
  }

  return matchedKey.publicKeyJwk;
};

const getDomain = (isRpStub) =>
  isRpStub ? `${process.env.ENVIRONMENT}.account.gov.uk` : `localhost:3000`;

const validateSignature = async (jwt, didKey) => {
  const parsedKey = await jose.importJWK(didKey);
  jose.jwtVerify(jwt, parsedKey);
};

const validateCoreIdentityJwt = async (jwt, isRpStub) => {
  const timeNowSeconds = Date.now() / 1000;
  const domain = getDomain(isRpStub);

  const jwtParts = jwt.split(".");
  strictEqual(jwtParts.length, 3);

  const header = decodeJwtPart(jwtParts[0]);
  const payload = decodeJwtPart(jwtParts[1]);

  strictEqual(
    header.kid.includes(
      isRpStub
        ? `did:web:identity.${domain}#`
        : `did:web:${domain.replace(":", encodeURIComponent(":"))}#`
    ),
    true,
    `Expected kid header value containing did:web.${domain}#, received: ${header.kid}`
  );
  strictEqual(header.alg, "ES256");

  strictEqual(payload.aud, process.env.RP_CLIENT_ID);
  strictEqual(payload.sub, process.env.TEST_USER_SUB);
  strictEqual(payload.vot, "P2");
  strictEqual(
    payload.iss,
    isRpStub ? `https://identity.${domain}/` : `http://${domain}/`
  );
  strictEqual(
    payload.vtm,
    isRpStub ? `https://oidc.${domain}/trustmark` : `http://${domain}/trustmark`
  );

  strictEqual(payload.nbf < timeNowSeconds, true);
  strictEqual(payload.iat < timeNowSeconds, true);
  strictEqual(payload.exp > timeNowSeconds, true);
  deepStrictEqual(payload.vc, CORE_IDENTITY_VC_CLAIM);

  const didKey = await fetchDidKey(
    isRpStub
      ? `https://identity.${domain}/.well-known/did.json`
      : `http://${domain}/.well-known/did.json`,
    header.kid
  );

  await validateSignature(jwt, didKey);
};

module.exports = {
  validateCoreIdentityJwt,
};
