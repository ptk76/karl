export interface DriveFile {
  id: string;
  name: string;
}

async function createDogFileInDearKarl(accessToken: string) {
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

class GoogleDrive {
  readonly #token;
  readonly #folder;
  constructor(accessToken: string, folder = "dearkarl") {
    this.#token = accessToken;
    this.#folder = folder;
  }

  async getRootFolderId(): Promise<any> {
    const headers = { Authorization: `Bearer ${this.#token}` };

    // 1. Search for an existing folder with this name (and parent, if given)
    let query = `name = '${this.#folder.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
      { headers },
    );
    if (!searchRes.ok) {
      throw new Error(
        `Failed to search for folder: ${searchRes.status} ${await searchRes.text()}`,
      );
    }

    const searchData = (await searchRes.json()) as any;

    if (searchData.files && searchData.files.length > 0) {
      // Folder already exists — return its id
      return searchData.files[0].id;
    }

    // 2. Not found — create it
    const metadata: Record<string, unknown> = {
      name: this.#folder,
      mimeType: "application/vnd.google-apps.folder",
    };

    const createRes = await fetch(
      "https://www.googleapis.com/drive/v3/files?fields=id,name",
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      },
    );

    if (!createRes.ok) {
      throw new Error(
        `Failed to create folder: ${createRes.status} ${await createRes.text()}`,
      );
    }
    return await createRes.json();
  }

  async fetchAllFiles(folderId: string) {
    const headers = { Authorization: `Bearer ${this.#token}` };

    // // 1. Find the folder
    // const folderQuery = encodeURIComponent(
    //   `name = '${this.#folder}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    // );
    // console.info("0", folderQuery);
    // const folderRes = await fetch(
    //   `https://www.googleapis.com/drive/v3/files?q=${folderQuery}&fields=files(id,name)`,
    //   { headers },
    // );
    // const folderData = (await folderRes.json()) as { files: Array<any> };
    // console.info("folderData", JSON.stringify(folderData));
    // console.info("1");
    // if (!folderData.files || folderData.files.length === 0) {
    //   throw new Error(`Folder ${this.#folder} not found`);
    // }
    // const folderId = folderData.files[0].id;

    // 2. List files inside that folder
    const filesQuery = encodeURIComponent(
      `'${folderId}' in parents and trashed = false`,
    );
    const filesRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${filesQuery}&fields=files(id,name,mimeType)`,
      { headers },
    );
    console.info("2");
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

  async pushFile(folderId: string, name: string, payload: string) {
    const headers = { Authorization: `Bearer ${this.#token}` };

    // // 1. Find the "dearkarl" folder
    // const folderQuery = encodeURIComponent(
    //   `name =  ${this.#folder} and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    // );
    // const folderRes = await fetch(
    //   `https://www.googleapis.com/drive/v3/files?q=${folderQuery}&fields=files(id,name)`,
    //   { headers },
    // );
    // const folderData = (await folderRes.json()) as { files: Array<any> };

    // if (!folderData.files || folderData.files.length === 0) {
    //   throw new Error(`Folder ${this.#folder} not found`);
    // }
    // const folderId = folderData.files[0].id;

    // 2. Create dog.txt inside that folder using multipart upload
    const metadata = {
      name: name,
      parents: [folderId],
      mimeType: "text/plain",
    };
    const fileContent = payload;

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
}

export default GoogleDrive;
