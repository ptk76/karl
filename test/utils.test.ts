import { describe, expect, it } from "vitest";
import { getSid } from "../worker/api/utils";

function reqWithCookie(cookie?: string) {
  const headers = cookie !== undefined ? { cookie } : {};
  return new Request("https://example.com/", { headers });
}

describe("getSid", () => {
  it("returns null when there is no cookie header", () => {
    expect(getSid(reqWithCookie())).toBeNull();
  });

  it("returns null when the cookie header is empty", () => {
    expect(getSid(reqWithCookie(""))).toBeNull();
  });

  it("returns null when there is no sid cookie", () => {
    expect(getSid(reqWithCookie("theme=dark; locale=en"))).toBeNull();
  });

  it("returns the sid when it is the only cookie", () => {
    expect(getSid(reqWithCookie("sid=abc123"))).toBe("abc123");
  });

  it("returns the sid when it appears after other cookies", () => {
    expect(getSid(reqWithCookie("theme=dark; sid=abc123; locale=en"))).toBe(
      "abc123",
    );
  });

  it("returns the sid when it is the first cookie and others follow", () => {
    expect(getSid(reqWithCookie("sid=abc123; theme=dark"))).toBe("abc123");
  });

  it("does not include a trailing cookie in the sid value", () => {
    expect(getSid(reqWithCookie("sid=abc; theme=dark"))).toBe("abc");
  });

  it("returns a sid value containing characters other than semicolons", () => {
    expect(getSid(reqWithCookie("sid=eyJhbGciOi.abc_def~"))).toBe(
      "eyJhbGciOi.abc_def~",
    );
  });

  it("does not match a cookie whose name merely ends in sid", () => {
    expect(getSid(reqWithCookie("xsid=123; sessionid=456"))).toBeNull();
  });

  it("is case sensitive", () => {
    expect(getSid(reqWithCookie("SID=abc123"))).toBeNull();
  });

  it("returns null when the sid value is empty", () => {
    expect(getSid(reqWithCookie("sid=; theme=dark"))).toBeNull();
  });
});
