import { createHmac, timingSafeEqual } from "node:crypto";

function safeCompare(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export function verifyGithubSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false;
  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeCompare(expected, signatureHeader);
}

export function verifyPlainSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeCompare(expected, signatureHeader);
}
