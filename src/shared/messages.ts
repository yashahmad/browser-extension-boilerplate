export const TOGGLE_SIDEBAR = 'sidebar:toggle' as const;

export type SidebarMessage = { type: typeof TOGGLE_SIDEBAR };

export function isSidebarMessage(value: unknown): value is SidebarMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === TOGGLE_SIDEBAR
  );
}

export const HOST_ID = 'sidebar-overlay-root';
