let _pending: File | null = null;

export function setPendingFile(f: File) { _pending = f; }

export function consumePendingFile(): File | null {
  const f = _pending;
  _pending = null;
  return f;
}
