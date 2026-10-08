import { describe, expect, it } from "vitest";
import { generateToken, sha256Hex } from "../worker/mcp/pat";

describe("generateToken", () => {
  it("produces the karl_ + 64-hex-chars format", () => {
    const token = generateToken();
    expect(token).toMatch(/^karl_[0-9a-f]{64}$/);
  });

  it("produces different tokens each call", () => {
    expect(generateToken()).not.toBe(generateToken());
  });
});

describe("sha256Hex", () => {
  it("matches the known SHA-256 vector for 'x'", async () => {
    // echo -n x | sha256sum
    expect(await sha256Hex("x")).toBe(
      "2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881",
    );
  });

  it("is deterministic", async () => {
    expect(await sha256Hex("karl_something")).toBe(
      await sha256Hex("karl_something"),
    );
  });
});
