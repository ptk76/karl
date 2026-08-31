/// <reference types="google.accounts" />

const CLIENT_ID =
  "90674426509-pq8jkhr2iauovabb612ij143omm7oec5.apps.googleusercontent.com";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

export interface DriveFile {
  id: string;
  name: string;
}

// Callback function to handle the Google Sign-In response
function handleCredentialResponse(
  response: google.accounts.id.CredentialResponse,
): void {
  const payload = decodeJWT(response.credential);
  console.log("User Email: " + payload.email);
}

// Decode a JWT locally (for debugging only - verify on the backend!)
function decodeJWT(token: string) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  );
  return JSON.parse(jsonPayload);
}

// Renders the "Sign in with Google" button (identity, not Drive access)
export function loginToGoogle() {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse,
  });

  const buttonElement = document.getElementById("g_id_signin");
  if (buttonElement) {
    google.accounts.id.renderButton(buttonElement, {
      type: "standard",
      theme: "outline",
      size: "large",
    });
  }
}

let tokenClient: google.accounts.oauth2.TokenClient | undefined;

function getTokenClient(
  callback: (response: google.accounts.oauth2.TokenResponse) => void,
): google.accounts.oauth2.TokenClient {
  tokenClient ??= google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback,
  });
  return tokenClient;
}

async function fetchDriveFiles(accessToken: string): Promise<DriveFile[]> {
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("pageSize", "10");
  url.searchParams.set("fields", "files(id,name)");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(
      `Drive API request failed: ${response.status} ${await response.text()}`,
    );
  }

  const data = (await response.json()) as { files?: DriveFile[] };
  return data.files ?? [];
}

/**
 * Prompts the user to log in to their Google account (if needed) and grant
 * Drive read access, then returns their Drive files.
 */
export function loginAndListDriveFiles(): Promise<DriveFile[]> {
  return new Promise((resolve, reject) => {
    const client = getTokenClient((response) => {
      if (response.error) {
        reject(response);
        return;
      }
      fetchDriveFiles(response.access_token).then(resolve, reject);
    });
    client.requestAccessToken();
  });
}
