import { describe, expect, it } from "vitest";
import {
  couldNotSaveEmail,
  diagErrorSubject,
  savedEmail,
  signInAgainEmail,
  unknownSenderEmail,
  wrongAddressEmail,
} from "../worker/api/messages";

const evil = `<img src=x onerror=alert(1)>`;

describe("mail copy", () => {
  it("escapes every placeholder taken from inbound mail", () => {
    const mails = [
      savedEmail("en", { subject: evil, filename: evil }),
      savedEmail("pl", { subject: evil, filename: evil }),
      unknownSenderEmail("en", { subject: evil, from: evil }),
      unknownSenderEmail("pl", { subject: evil, from: evil }),
      wrongAddressEmail("en", { subject: evil, to: evil, karlAddress: evil }),
      wrongAddressEmail("pl", { subject: evil, to: evil, karlAddress: evil }),
      signInAgainEmail("en", { subject: evil }),
      couldNotSaveEmail("pl", { subject: evil }),
    ];
    for (const m of mails) {
      expect(m.html).not.toContain("<img");
      expect(m.html).toContain("&lt;img");
    }
  });

  it("puts the footer with company details on every user mail", () => {
    const mails = [
      savedEmail("en", { subject: "s", filename: "f" }),
      unknownSenderEmail("en", { subject: "s", from: "a@b.c" }),
      wrongAddressEmail("pl", { subject: "s", to: "x@k", karlAddress: "y@k" }),
      signInAgainEmail("pl", { subject: "s" }),
      couldNotSaveEmail("en", { subject: "s" }),
    ];
    for (const m of mails) {
      expect(m.html).toContain("NIP");
      expect(m.html).toContain("6912215667");
      expect(m.html).toContain("mailto:hi@dearkarl.com");
      expect(m.html).not.toContain("Dear Karl");
    }
  });

  it("links the legal pages in the mail's language", () => {
    const en = savedEmail("en", { subject: "s", filename: "f" }).html;
    expect(en).toContain('href="https://dearkarl.com/privacy"');
    expect(en).toContain('href="https://dearkarl.com/terms"');

    const pl = savedEmail("pl", { subject: "s", filename: "f" }).html;
    expect(pl).toContain('href="https://dearkarl.com/polityka-prywatnosci"');
    expect(pl).toContain('href="https://dearkarl.com/regulamin"');
  });

  it("sends sign-in and sign-up links to the app, with matching link text", () => {
    const app = "https://karl.przemekkudla.pl";
    const mails = [
      signInAgainEmail("en", { subject: "s" }),
      signInAgainEmail("pl", { subject: "s" }),
      unknownSenderEmail("en", { subject: "s", from: "a@b.c" }),
      unknownSenderEmail("pl", { subject: "s", from: "a@b.c" }),
    ];
    for (const m of mails) {
      expect(m.html).toMatch(new RegExp(`<a href="${app}"[^>]*>${app}</a>`));
    }
  });

  it("never shows one address as link text while linking to another", () => {
    const mails = (["en", "pl"] as const).flatMap((l) => [
      savedEmail(l, { subject: "s", filename: "f" }),
      unknownSenderEmail(l, { subject: "s", from: "a@b.c" }),
      wrongAddressEmail(l, { subject: "s", to: "x@k", karlAddress: "y@k" }),
      signInAgainEmail(l, { subject: "s" }),
      couldNotSaveEmail(l, { subject: "s" }),
    ]);
    for (const m of mails) {
      for (const [, href, text] of m.html.matchAll(
        /<a href="([^"]*)"[^>]*>([^<]*)<\/a>/g,
      )) {
        const host = text.match(/([a-z0-9-]+\.)+[a-z]{2,}/i)?.[0];
        if (host) expect(href).toContain(host);
      }
    }
  });

  it("uses the agreed subjects", () => {
    expect(savedEmail("en", { subject: "s", filename: "Note" }).subject).toBe(
      "Saved: Note",
    );
    expect(savedEmail("pl", { subject: "s", filename: "Note" }).subject).toBe(
      "Zapisane: Note",
    );
    expect(signInAgainEmail("pl", { subject: "s" }).subject).toBe(
      "Zaloguj się ponownie do DearKarl",
    );
    expect(couldNotSaveEmail("en", { subject: "s" }).subject).toBe(
      "I couldn't save your email",
    );
  });

  it("keeps the Polish copy of mail 2", () => {
    expect(unknownSenderEmail("pl", { subject: "s", from: "a@b.c" }).subject).toBe(
      "Nie znam jeszcze tego adresu",
    );
  });

  it("tells the user their right address on mail 3", () => {
    const { html } = wrongAddressEmail("en", {
      subject: "s",
      to: "abc@dearkarl.com",
      karlAddress: "me123@dearkarl.com",
    });
    expect(html).toContain("me123@dearkarl.com");
  });
});

describe("diagErrorSubject", () => {
  it("uses only the first line", () => {
    expect(diagErrorSubject("boom\nstack")).toBe("[DearKarl] Error: boom");
    expect(diagErrorSubject("")).toBe("[DearKarl] Error: unknown");
  });
});
