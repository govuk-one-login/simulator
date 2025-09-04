import { hash } from "argon2";
import { isClientSecretValid } from "../../validators/client-secret-validator";
import { randomBytes } from "crypto";

describe("client secret validator tests", () => {
  it("returns true for a valid hash", async () => {
    const testSecret = "test-secret123";
    const encodedHash = await hash(testSecret, { salt: randomBytes(16) });

    expect(await isClientSecretValid(testSecret, encodedHash)).toBe(true);
  });

  it("returns false for a not matching hash", async () => {
    const testSecret = "test-secret123";
    const wrongHash = await hash("not-the-right-secret", {
      salt: randomBytes(16),
    });

    expect(await isClientSecretValid(testSecret, wrongHash)).toBe(false);
  });
});
