const base32 = require("hi-base32");
const crypto = require("node:crypto");

const generateTotpCode = () => {
  if (!process.env.TOTP_SECRET) {
    throw new Error("No TOTP secret set");
  }

  let counter = Math.floor(Date.now() / 30000);
  const decodedSecret = base32.decode.asBytes(process.env.TOTP_SECRET);
  const buffer = Buffer.alloc(8);

  for (let i = 0; i < 8; i++) {
    buffer[7 - i] = counter & 0xff;
    counter = counter >> 8;
  }

  const hmac = crypto
    .createHmac("SHA1", Buffer.from(decodedSecret))
    .update(buffer)
    .digest();

  const offset = hmac[hmac.length - 1] & 0xf;

  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (code % 10 ** 6).toString().padStart(6, "0");
};

module.exports = {
  generateTotpCode,
};
