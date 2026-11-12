import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  BookmarkIcon,
  CheckIcon,
  CopyIcon,
  EmptyPanelIcon,
  ExternalLinkIcon,
  PanelMarkIcon,
  TrashIcon,
  XIcon,
} from './icons';
import { getOpen, setOpen, subscribeOpen } from './store';
import {
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  formatRelative,
  hostOf,
  makeId,
  useStoredState,
  type PanelWidth,
  type SavedPage,
  type Settings,
  type Theme,
} from './storage';

type TabId = 'page' | 'saved' | 'settings';

type PageInfo = {
  title: string;
  url: string;
  hostname: string;
};

const TABS: ReadonlyArray<{ id: TabId; label: string }> = [
  { id: 'page', label: 'This page' },
  { id: 'saved', label: 'Saved' },
  { id: 'settings', label: 'Settings' },
];

const THEME_OPTIONS: ReadonlyArray<{ value: Theme; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const WIDTH_OPTIONS: ReadonlyArray<{ value: PanelWidth; label: string }> = [
  { value: 'standard', label: 'Standard' },
  { value: 'wide', label: 'Wide' },
];

function readPage(): PageInfo {
  const url = window.location.href;
  const hostname = window.location.hostname.replace(/^www\./, '');
  const title = document.title.trim() || hostname || 'Untitled page';
  return { title, url, hostname: hostname || url };
}

function extensionVersion(): string {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
      return chrome.runtime.getManifest().version;
    }
  } catch {
    // Running in the Vite preview page, where the extension APIs do not exist.
  }
  return '0.1.0';
}

function SavedList({
  items,
  onRemove,
}: {
  items: SavedPage[];
  onRemove: (id: string) => void;
}) {
  return (
    <ul className="saved-list">
      {items.map((item) => (
        <li key={item.id} className="saved-item">
          <a
            className="saved-item__main"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            title={item.url}
          >
            <span className="saved-item__badge" aria-hidden="true">
              {item.title.trim().charAt(0).toUpperCase() || '•'}
            </span>
            <span className="saved-item__text">
              <span className="saved-item__title">{item.title}</span>
              <span className="saved-item__meta">
                {hostOf(item.url)} · {formatRelative(item.savedAt)}
              </span>
            </span>
            <span className="saved-item__arrow">
              <ExternalLinkIcon />
            </span>
          </a>
          <button
            type="button"
            className="icon-button icon-button--small"
            onClick={() => onRemove(item.id)}
            aria-label={`Remove ${item.title}`}
            title="Remove"
          >
            <TrashIcon />
          </button>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty">
      <span className="empty__icon">
        <EmptyPanelIcon />
      </span>
      <p className="empty__title">{title}</p>
      <p className="empty__body">{body}</p>
      {actionLabel && onAction && (
        <button type="button" className="button button--secondary" onClick={onAction}>
          <BookmarkIcon />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function SettingToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="setting setting--switch">
      <div className="setting__text">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        className="switch"
        onClick={() => onChange(!checked)}
      >
        <span className="switch__thumb" />
      </button>
    </div>
  );
}

export function App() {
  const open = useSyncExternalStore(subscribeOpen, getOpen, getOpen);
  const [tab, setTab] = useState<TabId>('page');
  const [page, setPage] = useState<PageInfo>(readPage);
  const [savedPages, setSavedPages] = useStoredState<SavedPage[]>(
    STORAGE_KEYS.savedPages,
    [],
  );
  const [settings, updateSettings] = useStoredState<Settings>(
    STORAGE_KEYS.settings,
    DEFAULT_SETTINGS,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [version] = useState(extensionVersion);

  const panelRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});
  const toastTimer = useRef<number | undefined>(undefined);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current !== undefined) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current !== undefined) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setPage(readPage());
    const frame = window.requestAnimationFrame(() => {
      panelRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open]);

  useEffect(() => {
    const syncPage = () => setPage(readPage());
    window.addEventListener('popstate', syncPage);
    window.addEventListener('hashchange', syncPage);
    return () => {
      window.removeEventListener('popstate', syncPage);
      window.removeEventListener('hashchange', syncPage);
    };
  }, []);

  const isCurrentPageSaved = savedPages.some((item) => item.url === page.url);
  const lastSaved = savedPages[0];

  const saveCurrentPage = () => {
    if (isCurrentPageSaved) return;
    const item: SavedPage = {
      id: makeId(),
      title: page.title,
      url: page.url,
      savedAt: Date.now(),
    };
    setSavedPages((previous) => [item, ...previous]);
    showToast('Saved to sidebar');
  };

  const removeSavedPage = (id: string) => {
    setSavedPages((previous) => previous.filter((item) => item.id !== id));
    showToast('Removed');
  };

  const clearSavedPages = () => {
    if (savedPages.length === 0) return;
    const confirmed = window.confirm('Remove all saved pages from this browser?');
    if (!confirmed) return;
    setSavedPages([]);
    showToast('Saved pages cleared');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(page.url);
      showToast('Link copied');
    } catch {
      showToast('Could not copy the link');
    }
  };

  const changeSettings = (patch: Partial<Settings>) => {
    updateSettings((previous) => ({ ...previous, ...patch }));
  };

  const onTabKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const offset = event.key === 'ArrowRight' ? 1 : -1;
    const next = TABS[(index + offset + TABS.length) % TABS.length];
    setTab(next.id);
    tabRefs.current[next.id]?.focus();
  };

  const recentPages = savedPages.slice(0, 3);

  return (
    <div
      className="sidebar-shell"
      data-open={open}
      data-theme={settings.theme}
      data-width={settings.width}
      data-reduce-motion={settings.reduceMotion ? 'true' : undefined}
    >
      <aside
        className="sidebar"
        aria-label="Sidebar overlay"
        ref={panelRef}
        tabIndex={-1}
      >
        <header className="sidebar__header">
          <span className="brand" aria-hidden="true">
            <PanelMarkIcon />
          </span>
          <div className="brand__text">
            <p className="eyebrow">Browser sidebar</p>
            <h1 className="brand__title">Sidebar Starter</h1>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
            title="Close (Esc)"
          >
            <XIcon />
          </button>
        </header>

        <div className="tabs" role="tablist" aria-label="Sidebar sections">
          {TABS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`panel-${item.id}`}
              tabIndex={tab === item.id ? 0 : -1}
              className="tabs__tab"
              onClick={() => setTab(item.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              ref={(element) => {
                tabRefs.current[item.id] = element;
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="sidebar__body">
          {tab === 'page' && (
            <section
              role="tabpanel"
              id="panel-page"
              aria-labelledby="tab-page"
              className="tab-panel"
            >
              <div className="card current-page">
                <p className="eyebrow">Current tab</p>
                <h2 className="current-page__title" title={page.title}>
                  {page.title}
                </h2>
                <p className="current-page__domain">{page.hostname}</p>
                <div className="button-row">
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={saveCurrentPage}
                    disabled={isCurrentPageSaved}
                  >
                    {isCurrentPageSaved ? <CheckIcon /> : <BookmarkIcon />}
                    {isCurrentPageSaved ? 'Saved' : 'Save page'}
                  </button>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => void copyLink()}
                  >
                    <CopyIcon />
                    Copy URL
                  </button>
                </div>
              </div>

              <div className="stats">
                <div className="stat">
                  <span className="stat__value">{savedPages.length}</span>
                  <span className="stat__label">Saved pages</span>
                </div>
                <div className="stat">
                  <span className="stat__value">
                    {lastSaved ? formatRelative(lastSaved.savedAt) : '—'}
                  </span>
                  <span className="stat__label">Last save</span>
                </div>
              </div>

              <div className="section">
                <div className="section__heading">
                  <h3>Recent saves</h3>
                  {savedPages.length > 3 && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setTab('saved')}
                    >
                      View all
                    </button>
                  )}
                </div>
                {recentPages.length > 0 ? (
                  <SavedList items={recentPages} onRemove={removeSavedPage} />
                ) : (
                  <EmptyState
                    title="Nothing saved yet"
                    body="Save the page you are reading to keep it one click away."
                    actionLabel={isCurrentPageSaved ? undefined : 'Save this page'}
                    onAction={isCurrentPageSaved ? undefined : saveCurrentPage}
                  />
                )}
              </div>
            </section>
          )}

          {tab === 'saved' && (
            <section
              role="tabpanel"
              id="panel-saved"
              aria-labelledby="tab-saved"
              className="tab-panel"
            >
              <div className="section">
                <div className="section__heading">
                  <h3>Saved pages</h3>
                  {savedPages.length > 0 && (
                    <button
                      type="button"
                      className="text-button text-button--danger"
                      onClick={clearSavedPages}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {savedPages.length > 0 ? (
                  <SavedList items={savedPages} onRemove={removeSavedPage} />
                ) : (
                  <EmptyState
                    title="No saved pages"
                    body="Pages you save from the sidebar appear here, newest first."
                    actionLabel={isCurrentPageSaved ? undefined : 'Save this page'}
                    onAction={isCurrentPageSaved ? undefined : saveCurrentPage}
                  />
                )}
              </div>
            </section>
          )}

          {tab === 'settings' && (
            <section
              role="tabpanel"
              id="panel-settings"
              aria-labelledby="tab-settings"
              className="tab-panel"
            >
              <div className="card settings-card">
                <div className="setting">
                  <div className="setting__text">
                    <h3>Theme</h3>
                    <p>Follow the browser or force a mode.</p>
                  </div>
                  <div className="segmented" role="group" aria-label="Theme">
                    {THEME_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className="segmented__option"
                        aria-pressed={settings.theme === option.value}
                        onClick={() => changeSettings({ theme: option.value })}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="setting">
                  <div className="setting__text">
                    <h3>Panel width</h3>
                    <p>Wide gives dense pages more room.</p>
                  </div>
                  <div className="segmented" role="group" aria-label="Panel width">
                    {WIDTH_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className="segmented__option"
                        aria-pressed={settings.width === option.value}
                        onClick={() => changeSettings({ width: option.value })}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <SettingToggle
                  title="Reduce motion"
                  description="Skip the slide animation."
                  checked={settings.reduceMotion}
                  onChange={(reduceMotion) => changeSettings({ reduceMotion })}
                />
              </div>

              <div className="card about">
                <h3>About this panel</h3>
                <p>
                  The content script mounts React inside a Shadow DOM, so page
                  styles cannot reach the sidebar and the sidebar cannot leak
                  styles back.
                </p>
                <dl className="about__facts">
                  <div>
                    <dt>Version</dt>
                    <dd>{version}</dd>
                  </div>
                  <div>
                    <dt>Shortcut</dt>
                    <dd>Alt + Shift + S</dd>
                  </div>
                  <div>
                    <dt>Storage</dt>
                    <dd>chrome.storage.local</dd>
                  </div>
                </dl>
              </div>
            </section>
          )}
        </div>

        <footer className="sidebar__footer">
          <span>Sidebar Overlay Starter</span>
          <span className="shortcut" aria-label="Toggle shortcut: Alt plus Shift plus S">
            <kbd>Alt</kbd>
            <span>+</span>
            <kbd>Shift</kbd>
            <span>+</span>
            <kbd>S</kbd>
          </span>
        </footer>

        {toast && (
          <div className="toast" role="status" aria-live="polite">
            {toast}
          </div>
        )}
      </aside>
    </div>
  );
}
