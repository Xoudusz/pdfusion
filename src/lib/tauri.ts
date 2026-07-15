export const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export async function openFiles(opts: {
  multiple?: boolean;
  accept?: string;
}): Promise<File[]> {
  if (isTauri) {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { readFile } = await import("@tauri-apps/plugin-fs");
    const ext = opts.accept
      ?.split(",")
      .map((s) => s.trim().replace(".", "").replace("*", ""))
      .filter(Boolean);
    const result = await open({ multiple: opts.multiple ?? false, filters: ext?.length ? [{ name: "Files", extensions: ext }] : [] });
    if (!result) return [];
    const paths = Array.isArray(result) ? result : [result];
    return Promise.all(
      paths.map(async (p) => {
        const bytes = await readFile(p);
        const name = p.split(/[/\\]/).pop() ?? "file";
        return new File([bytes], name);
      })
    );
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = opts.multiple ?? false;
    if (opts.accept) input.accept = opts.accept;
    input.onchange = () => resolve(Array.from(input.files ?? []));
    input.click();
  });
}

export async function saveFile(
  data: Uint8Array,
  filename: string
): Promise<void> {
  if (isTauri) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeFile } = await import("@tauri-apps/plugin-fs");
    const ext = filename.split(".").pop();
    const path = await save({
      defaultPath: filename,
      filters: ext ? [{ name: ext.toUpperCase(), extensions: [ext] }] : [],
    });
    if (path) await writeFile(path, data);
    return;
  }
  const blob = new Blob([data]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
