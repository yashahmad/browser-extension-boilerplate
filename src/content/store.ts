// Open/closed state lives outside React so the content script and the preview
// page can toggle the panel without passing props through the shadow boundary.
let open = false;
const listeners = new Set<() => void>();

export function getOpen(): boolean {
  return open;
}

export function setOpen(next: boolean): void {
  if (next === open) return;
  open = next;
  for (const listener of listeners) listener();
}

export function toggleOpen(): void {
  setOpen(!open);
}

export function subscribeOpen(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
