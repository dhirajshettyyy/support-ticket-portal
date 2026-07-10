import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyGithubSignature, verifyPlainSignature } from "../webhookSignatures";

const SECRET = "test-secret";
const BODY = JSON.stringify({ hello: "world" });

describe("verifyGithubSignature", () => {
  it("accepts a correctly signed body", () => {
    const signature = "sha256=" + createHmac("sha256", SECRET).update(BODY).digest("hex");
    expect(verifyGithubSignature(BODY, signature, SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const signature = "sha256=" + createHmac("sha256", SECRET).update(BODY).digest("hex");
    expect(verifyGithubSignature(BODY + "x", signature, SECRET)).toBe(false);
  });

  it("rejects a missing signature header", () => {
    expect(verifyGithubSignature(BODY, null, SECRET)).toBe(false);
  });

  it("rejects a malformed signature", () => {
    expect(verifyGithubSignature(BODY, "sha256=deadbeef", SECRET)).toBe(false);
  });
});

describe("verifyPlainSignature", () => {
  it("accepts a correctly signed body", () => {
    const signature = createHmac("sha256", SECRET).update(BODY).digest("hex");
    expect(verifyPlainSignature(BODY, signature, SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const signature = createHmac("sha256", SECRET).update(BODY).digest("hex");
    expect(verifyPlainSignature(BODY + "x", signature, SECRET)).toBe(false);
  });

  it("rejects a missing signature header", () => {
    expect(verifyPlainSignature(BODY, null, SECRET)).toBe(false);
  });
});
