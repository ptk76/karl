import { describe, expect, it } from "vitest";
import { senderAuthenticationFailed } from "../worker/api/email";

// senderAuthenticationFailed only touches message.headers.get("Authentication-Results"),
// so a stub is enough — no need to construct a real ForwardableEmailMessage.
function withAuthResults(authResults: string | null): ForwardableEmailMessage {
  return {
    headers: {
      get: () => authResults,
    },
  } as unknown as ForwardableEmailMessage;
}

describe("senderAuthenticationFailed", () => {
  it("rejects when DMARC fails", () => {
    expect(
      senderAuthenticationFailed(
        withAuthResults(
          "Authentication-Results: mx.example.com;\n dmarc=fail (policy=none) header.from=example.com",
        ),
      ),
    ).toBe(true);
  });

  it("rejects when SPF fails even if DMARC passes", () => {
    expect(
      senderAuthenticationFailed(
        withAuthResults(
          "Authentication-Results: mx.google.com; spf=hardfail (google.com: domain of spam@bad.com does not designate 1.2.3.4 as permitted sender) smtp.mailfrom=spam@bad.com; dmarc=pass (p=REJECT sp=NONE dis=NONE) header.from=bad.com",
        ),
      ),
    ).toBe(true);
  });

  it("lets through a full pass verdict", () => {
    expect(
      senderAuthenticationFailed(
        withAuthResults(`Authentication-Results: mx.google.com;
       dkim=pass header.i=@gmail.com header.s=20230601 header.b=xyz;
       spf=pass (google.com: domain of user@gmail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=user@gmail.com;
       dmarc=pass (p=NONE sp=NONE dis=NONE) header.from=gmail.com`),
      ),
    ).toBe(false);
  });

  it("lets through when the header is absent", () => {
    expect(senderAuthenticationFailed(withAuthResults(null))).toBe(false);
  });

  it("lets through when there is no dmarc or spf verdict", () => {
    expect(
      senderAuthenticationFailed(
        withAuthResults(
          "Authentication-Results: mx.example.com; dkim=neutral header.i=@example.com header.s=sel1 header.b=abc",
        ),
      ),
    ).toBe(false);
  });

  it("lets through spf=softfail", () => {
    expect(
      senderAuthenticationFailed(
        withAuthResults(
          "Authentication-Results: mx.example.com; spf=softfail (example.com: domain of user@example.com does not designate 1.2.3.4 as permitted sender) smtp.mailfrom=user@example.com; dmarc=pass (p=NONE sp=NONE dis=NONE) header.from=example.com",
        ),
      ),
    ).toBe(false);
  });

  it("lets through spf=neutral", () => {
    expect(
      senderAuthenticationFailed(
        withAuthResults(
          "Authentication-Results: mx.example.com; spf=neutral (example.com: domain of user@example.com does not designate 1.2.3.4 as permitted sender) smtp.mailfrom=user@example.com",
        ),
      ),
    ).toBe(false);
  });

  it("lets through dmarc=none", () => {
    expect(
      senderAuthenticationFailed(
        withAuthResults(
          "Authentication-Results: mx.example.com; dmarc=none (p=NONE sp=NONE dis=NONE) header.from=example.com",
        ),
      ),
    ).toBe(false);
  });

  it("rejects lowercase header text (the check is case-insensitive)", () => {
    expect(
      senderAuthenticationFailed(
        withAuthResults("authentication-results: dmarc=fail"),
      ),
    ).toBe(true);
  });
});
