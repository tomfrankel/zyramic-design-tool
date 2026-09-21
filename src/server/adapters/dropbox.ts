export interface DropboxWrite {
  projectId: string;
  files: { name: string; contentType: string; bytes?: number }[];
}

const ROOT = process.env.DROPBOX_ROOT || "/Zyramic Setup Info/Proposal Software/Orders";

export async function persistOrderFolder(input: DropboxWrite) {
  const folder = `${ROOT.replace(/\/$/, "")}/${input.projectId}`;
  const enabled = process.env.DROPBOX_ENABLED === "true" && Boolean(process.env.DROPBOX_ACCESS_TOKEN);
  return {
    adapter: "dropbox",
    status: enabled ? "attempted" : "stub",
    enabled,
    folder,
    files: input.files.map((f) => `${folder}/${f.name}`),
    note: enabled
      ? "DROPBOX_ENABLED is true. This draft still writes a stub receipt unless a later connector is wired."
      : "Dropbox adapter stub. Target folder is recorded; no live upload is performed without a token and a later connector."
  };
}
