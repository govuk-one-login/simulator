const { strictEqual } = require("assert");
const jose = require("jose");

const decodeJwtPart = (part) =>
  JSON.parse(Buffer.from(part, "base64url").toString());

const fetchIdTokenKey = async (url, kid) => {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Failed to fetch DID key for url: " + url);
  }

  const jsonRespose = await res.json();

  const matchedKey = jsonRespose.keys?.find((key) => key.kid == kid);

  if (!matchedKey) {
    throw new Error(
      `Failed to find matching key for URL: ${url} and KeyId: ${kid}`
    );
  }

  return matchedKey;
};

const validateSignature = async (jwt, tokenKey) => {
  const parsedKey = await jose.importJWK(tokenKey);
  jose.jwtVerify(jwt, parsedKey);
};

const getDomain = (isRpStub) =>
  isRpStub ? `${process.env.ENVIRONMENT}.account.gov.uk` : `localhost:3000`;

const validateIdToken = async (idToken, isRpStub) => {
  const timeNowSeconds = Date.now() / 1000;
  const domain = getDomain(isRpStub);

  const jwtParts = idToken.split(".");
  strictEqual(jwtParts.length, 3);

  const header = decodeJwtPart(jwtParts[0]);
  const payload = decodeJwtPart(jwtParts[1]);

  strictEqual(typeof header.kid, "string");
  strictEqual(header.alg, "ES256");

  strictEqual(typeof payload.at_hash, "string");
  strictEqual(typeof payload.sid, "string");
  strictEqual(typeof payload.nonce, "string");

  strictEqual(payload.sub, process.env.TEST_USER_SUB);
  strictEqual(payload.aud, process.env.RP_CLIENT_ID);
  strictEqual(payload.auth_time < timeNowSeconds, true);
  strictEqual(payload.exp > timeNowSeconds, true);
  strictEqual(payload.iat < timeNowSeconds, true);
  strictEqual(
    payload.iss,
    isRpStub ? `https://oidc.${domain}/` : `http://${domain}/`
  );
  strictEqual(payload.vot, "Cl.Cm");
  strictEqual(
    payload.vtm,
    isRpStub ? `https://oidc.${domain}/trustmark` : `http://${domain}/trustmark`
  );

  const idTokenKey = await fetchIdTokenKey(
    isRpStub
      ? `https://oidc.${domain}/.well-known/jwks.json`
      : `http://${domain}/.well-known/jwks.json`,
    header.kid
  );

  await validateSignature(idToken, idTokenKey);
};

module.exports = {
  validateIdToken,
};
