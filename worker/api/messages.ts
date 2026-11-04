/**
 * User-facing mail copy, as agreed in docs/email-copy-proposal.md.
 *
 * Every mail follows one template: greeting → what happened → what to do →
 * "Karl" → footer. Every placeholder comes from inbound mail anyone can send,
 * so all of them are HTML-escaped before they reach the body.
 */
import { escapeHtml } from "../send-email";

export type Lang = "en" | "pl";

export interface EmailContent {
  subject: string;
  /** HTML body, ready for Elastic Email. */
  html: string;
}

const SITE = "https://dearkarl.com";
const CONTACT = "hi@dearkarl.com";
const PRIVACY = `${SITE}/privacy`;
const TERMS = `${SITE}/terms`;

const link = (url: string, text = url) => `<a href="${url}">${text}</a>`;
const mailto = (address: string) => `<a href="mailto:${address}">${address}</a>`;
const p = (...lines: string[]) => `<p>${lines.join("<br>\n")}</p>`;

function footer(lang: Lang, whyLine: string): string {
  const lines =
    lang === "pl"
      ? [
          "--",
          `DearKarl · ${link(SITE)}`,
          `Kontakt: ${mailto(CONTACT)}`,
          "Technologie 21 Aleksander Jaworski",
          "ul. Pionerska 7/2, 53-213 Wrocław",
          "NIP: 6912215667 · wpis do CEIDG",
          `Polityka prywatności: ${link(PRIVACY)}`,
          `Regulamin: ${link(TERMS)}`,
          whyLine,
        ]
      : [
          "--",
          `DearKarl · ${link(SITE)}`,
          `Contact: ${mailto(CONTACT)}`,
          "Technologie 21 Aleksander Jaworski",
          "Pionerska 7/2, 53-213 Wrocław, Poland",
          "VAT ID (NIP): 6912215667 · registered in CEIDG",
          `Privacy policy: ${link(PRIVACY)}`,
          `Terms: ${link(TERMS)}`,
          whyLine,
        ];
  return `<p style="color:#666;font-size:12px">${lines.join("<br>\n")}</p>`;
}

const ACCOUNT_WHY: Record<Lang, string> = {
  en: "You got this because you have a DearKarl account.",
  pl: "Dostajesz to, bo masz konto w DearKarl.",
};

const body = (...blocks: string[]) => blocks.join("\n");

// ---------------------------------------------------------------- 1. Saved

export function savedEmail(
  lang: Lang,
  v: { subject: string; filename: string },
): EmailContent {
  const subject = escapeHtml(v.subject);
  const filename = escapeHtml(v.filename);
  if (lang === "pl") {
    return {
      subject: `Zapisane: ${v.filename}`,
      html: body(
        p("Cześć,"),
        p(
          `zapisałem Twojego maila „${subject}” na Twoim Dysku Google, w folderze dearkarl, jako „${filename}”.`,
        ),
        p("Karl"),
        footer(
          "pl",
          "Dostajesz to po każdym zapisanym mailu.",
        ),
      ),
    };
  }
  return {
    subject: `Saved: ${v.filename}`,
    html: body(
      p("Hi,"),
      p(
        `I saved your email "${subject}" to the dearkarl folder on your Google Drive as "${filename}".`,
      ),
      p("Karl"),
      footer(
        "en",
        "You get this after every saved email.",
      ),
    ),
  };
}

// ------------------------------------------------- 2. Sender not recognised

export function unknownSenderEmail(
  lang: Lang,
  v: { subject: string; from: string },
): EmailContent {
  const subject = escapeHtml(v.subject);
  const from = escapeHtml(v.from);
  if (lang === "pl") {
    return {
      subject: "Nie znam jeszcze tego adresu",
      html: body(
        p("Cześć,"),
        p(
          `dostałem Twojego maila „${subject}”, ale adres ${from} nie jest połączony z żadnym kontem DearKarl. Nic nie zapisałem.`,
        ),
        p(
          "Jeśli masz już konto, wyślij maila z adresu Google przypisanego do konta.",
          `Jeśli nie, załóż je na ${link(SITE)}.`,
        ),
        p("Karl"),
        footer(
          "pl",
          `Dostajesz to, bo z adresu ${from} przyszedł mail na adres DearKarl.`,
        ),
      ),
    };
  }
  return {
    subject: "I don't know this address yet",
    html: body(
      p("Hi,"),
      p(
        `I got your email "${subject}", but ${from} isn't linked to a DearKarl account, so I didn't save anything.`,
      ),
      p(
        "If you already have an account, send from the Google address you signed up with.",
        `If not, you can create one at ${link(SITE)}.`,
      ),
      p("Karl"),
      footer(
        "en",
        `You got this because an email from ${from} was sent to a DearKarl address.`,
      ),
    ),
  };
}

// ------------------------------------------------ 3. Wrong DearKarl address

export function wrongAddressEmail(
  lang: Lang,
  v: { subject: string; to: string; karlAddress: string },
): EmailContent {
  const subject = escapeHtml(v.subject);
  const to = escapeHtml(v.to);
  const karl = escapeHtml(v.karlAddress);
  if (lang === "pl") {
    return {
      subject: "To nie jest Twój adres DearKarl",
      html: body(
        p("Cześć,"),
        p(
          `mail „${subject}” poszedł na ${to}, a to nie jest Twój adres DearKarl. Nic nie zapisałem.`,
        ),
        p(`Twój adres to ${karl}. Wyślij maila tam, a go zapiszę.`),
        p("Karl"),
        footer("pl", ACCOUNT_WHY.pl),
      ),
    };
  }
  return {
    subject: "That isn't your DearKarl address",
    html: body(
      p("Hi,"),
      p(
        `You sent "${subject}" to ${to}, which isn't your DearKarl address, so I didn't save anything.`,
      ),
      p(`Your address is ${karl}. Send the email there and I'll save it.`),
      p("Karl"),
      footer("en", ACCOUNT_WHY.en),
    ),
  };
}

// ---------------------------------------------------------- 4. Sign in again

export function signInAgainEmail(
  lang: Lang,
  v: { subject: string },
): EmailContent {
  const subject = escapeHtml(v.subject);
  if (lang === "pl") {
    return {
      subject: "Zaloguj się ponownie do DearKarl",
      html: body(
        p("Cześć,"),
        p(
          `nie zapisałem „${subject}”, bo wygasł mój dostęp do Twojego Dysku Google.`,
        ),
        p(
          `Zaloguj się ponownie na ${link(SITE)} i wyślij maila jeszcze raz.`,
        ),
        p("Karl"),
        footer("pl", ACCOUNT_WHY.pl),
      ),
    };
  }
  return {
    subject: "Please sign in to DearKarl again",
    html: body(
      p("Hi,"),
      p(
        `I couldn't save "${subject}" because my access to your Google Drive has expired. Nothing was saved.`,
      ),
      p(`Sign in again at ${link(SITE)}, then send the email once more.`),
      p("Karl"),
      footer("en", ACCOUNT_WHY.en),
    ),
  };
}

// ----------------------------------------------------------- 5. Could not save

export function couldNotSaveEmail(
  lang: Lang,
  v: { subject: string },
): EmailContent {
  const subject = escapeHtml(v.subject);
  if (lang === "pl") {
    return {
      subject: "Nie udało mi się zapisać Twojego maila",
      html: body(
        p("Cześć,"),
        p(`nie mogłem zapisać „${subject}” na Twoim Dysku Google.`),
        p(
          "Najczęściej to znaczy, że dysk jest pełny. Zwolnij trochę miejsca i wyślij maila jeszcze raz.",
          `Jeśli to się powtarza, napisz do nas: ${mailto(CONTACT)}.`,
        ),
        p("Karl"),
        footer("pl", ACCOUNT_WHY.pl),
      ),
    };
  }
  return {
    subject: "I couldn't save your email",
    html: body(
      p("Hi,"),
      p(`I couldn't save "${subject}" to your Google Drive. Nothing was saved.`),
      p(
        "This usually means the drive is full. Free up some space and send the email again.",
        `If it keeps happening, write to ${mailto(CONTACT)}.`,
      ),
      p("Karl"),
      footer("en", ACCOUNT_WHY.en),
    ),
  };
}

// ------------------------------------------------------------ Operator mails

export const DIAG_PREFIX = "[DearKarl]";

export const diagAuthRejectedSubject = `${DIAG_PREFIX} Rejected: sender authentication failed`;

/** `[DearKarl] Error: <first line of the message>`, kept short for filters. */
export function diagErrorSubject(message: string): string {
  const first = (message.split(/\r?\n/)[0] ?? "").trim().slice(0, 120);
  return `${DIAG_PREFIX} Error: ${first || "unknown"}`;
}
