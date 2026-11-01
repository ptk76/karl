/** The mail-receiving domain for Karl addresses. The worker returns only the
    local part (`user.login`); the frontend appends the domain mail routes on.
    Both the connect step and the account page show this same address. */
export const KARL_ADDRESS_DOMAIN = "dearkarl.com";

export function formatKarlAddress(karlEmail: string): string {
  return `${karlEmail}@${KARL_ADDRESS_DOMAIN}`;
}
