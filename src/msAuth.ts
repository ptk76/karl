import { PublicClientApplication, type AccountInfo } from "@azure/msal-browser";

// From your app registration in the Azure Portal (Entra ID > App registrations).
const CLIENT_ID = "18f0853d-1341-48e4-9174-5279489455bd";
const AUTHORITY = "https://login.microsoftonline.com/common";
const DRIVE_SCOPES = ["Files.Read"];

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: CLIENT_ID,
    authority: AUTHORITY,
    // A dedicated blank page (rather than the app root) so the popup never
    // loads the full SPA and the auth response can't leak into the main
    // tab's URL.
    redirectUri: `${window.location.origin}/blank.html`,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
});

let msalReady: Promise<void> | undefined;

function ensureMsalReady(): Promise<void> {
  msalReady ??= msalInstance.initialize();
  return msalReady;
}

export interface OneDriveFile {
  id: string;
  name: string;
}

let pendingAccessToken: Promise<string> | undefined;

// Guards against overlapping loginPopup/acquireTokenPopup calls (e.g. a
// double click), which MSAL rejects with "interaction_in_progress".
function getAccessToken(): Promise<string> {
  pendingAccessToken ??= acquireAccessToken().finally(() => {
    pendingAccessToken = undefined;
  });
  return pendingAccessToken;
}

async function acquireAccessToken(): Promise<string> {
  await ensureMsalReady();

  let account: AccountInfo | undefined = msalInstance.getAllAccounts()[0];

  if (!account) {
    const loginResult = await msalInstance.loginPopup({
      scopes: DRIVE_SCOPES,
    });
    account = loginResult.account ?? undefined;
  }

  if (!account) {
    throw new Error("Microsoft sign-in did not return an account");
  }

  try {
    const tokenResult = await msalInstance.acquireTokenSilent({
      scopes: DRIVE_SCOPES,
      account,
    });
    return tokenResult.accessToken;
  } catch {
    const tokenResult = await msalInstance.acquireTokenPopup({
      scopes: DRIVE_SCOPES,
      account,
    });
    return tokenResult.accessToken;
  }
}

async function fetchOneDriveFiles(
  accessToken: string,
): Promise<OneDriveFile[]> {
  const response = await fetch(
    "https://graph.microsoft.com/v1.0/me/drive/root/children?$select=id,name",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) {
    throw new Error(
      `OneDrive request failed: ${response.status} ${await response.text()}`,
    );
  }

  const data = (await response.json()) as { value?: OneDriveFile[] };
  return data.value ?? [];
}

/**
 * Prompts the user to log in to their Microsoft account (if needed) and
 * grant OneDrive read access, then returns their OneDrive files.
 */
export async function loginAndListOneDriveFiles(): Promise<OneDriveFile[]> {
  const accessToken = await getAccessToken();
  return fetchOneDriveFiles(accessToken);
}
