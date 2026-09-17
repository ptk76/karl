export interface DriveFile {
  id: string;
  name: string;
}

export async function fetchDriveFiles(
  accessToken: string,
): Promise<DriveFile[]> {
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("pageSize", "10");
  url.searchParams.set("fields", "files(id,name)");

  console.info("FILES", 1);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.info("FILES", 2, response);

  if (!response.ok) {
    throw new Error(
      `Drive API request failed: ${response.status} ${await response.text()}`,
    );
  }
  console.info("FILES", 3);

  const data = (await response.json()) as { files?: DriveFile[] };
  console.info("FILES", 4, data);
  return data.files ?? [];
}

export async function fetchDearKarlFiles(
  accessToken: string,
): Promise<DriveFile[]> {
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("pageSize", "10");
  url.searchParams.set("fields", "files(id,name)");

  console.info("FILES", 1);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.info("FILES", 2, response);

  if (!response.ok) {
    throw new Error(
      `Drive API request failed: ${response.status} ${await response.text()}`,
    );
  }
  console.info("FILES", 3);

  const data = (await response.json()) as { files?: DriveFile[] };
  console.info("FILES", 4, data);
  return data.files ?? [];
}

export async function readDearKarlFiles(accessToken: string) {
  const headers = { Authorization: `Bearer ${accessToken}` };

  // 1. Find the "dearkarl" folder
  const folderQuery = encodeURIComponent(
    `name = 'dearkarl' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
  );
  const folderRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${folderQuery}&fields=files(id,name)`,
    { headers },
  );
  const folderData = (await folderRes.json()) as { files: Array<any> };

  if (!folderData.files || folderData.files.length === 0) {
    throw new Error("Folder 'dearkarl' not found");
  }
  const folderId = folderData.files[0].id;

  // 2. List files inside that folder
  const filesQuery = encodeURIComponent(
    `'${folderId}' in parents and trashed = false`,
  );
  const filesRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${filesQuery}&fields=files(id,name,mimeType)`,
    { headers },
  );
  const filesData = (await filesRes.json()) as { files: Array<any> };
  const files = filesData.files || [];

  // 3. Download the content of each file
  const results = [];
  for (const file of files) {
    let content;

    if (file.mimeType.startsWith("application/vnd.google-apps")) {
      // Google-native file (Doc/Sheet/Slide) — export as plain text
      const exportRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`,
        { headers },
      );
      content = await exportRes.text();
    } else {
      // Regular file (e.g. .txt, .csv) — download directly
      const downloadRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
        { headers },
      );
      content = await downloadRes.text();
    }

    results.push({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      content,
    });
  }

  return results;
}

export async function createDogFileInDearKarl(accessToken: string) {
  const headers = { Authorization: `Bearer ${accessToken}` };

  // 1. Find the "dearkarl" folder
  const folderQuery = encodeURIComponent(
    `name = 'dearkarl' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
  );
  const folderRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${folderQuery}&fields=files(id,name)`,
    { headers },
  );
  const folderData = (await folderRes.json()) as { files: Array<any> };

  if (!folderData.files || folderData.files.length === 0) {
    throw new Error("Folder 'dearkarl' not found");
  }
  const folderId = folderData.files[0].id;

  // 2. Create dog.txt inside that folder using multipart upload
  const metadata = {
    name: "dog.txt",
    parents: [folderId],
    mimeType: "text/plain",
  };
  const fileContent = "Ala ma kota";

  const boundary = "-------314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartBody =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    "Content-Type: text/plain\r\n\r\n" +
    fileContent +
    closeDelimiter;

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,parents",
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    },
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Failed to create dog.txt: ${uploadRes.status} ${err}`);
  }

  return uploadRes.json(); // { id, name, parents }
}
