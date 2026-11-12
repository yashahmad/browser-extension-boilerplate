import { StrictMode, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../content/App';
import { getOpen, setOpen, subscribeOpen } from '../content/store';
import '../content/styles.css';
import './preview.css';

function PreviewPage() {
  const open = useSyncExternalStore(subscribeOpen, getOpen, getOpen);

  return (
    <>
      <main className="preview">
        <nav className="preview__nav">
          <span className="preview__wordmark">Sidebar Overlay Starter</span>
          <span className="preview__tag">React · Vite · MV3</span>
        </nav>

        <section className="preview__hero">
          <p className="preview__eyebrow">Extension starter</p>
          <h1>A sidebar that sits over the page, not in a popup.</h1>
          <p className="preview__lede">
            The content script mounts React inside a Shadow DOM and slides the
            panel in from the right. Page styles stay out. Sidebar styles stay
            in. Open it with the toolbar icon or Alt + Shift + S.
          </p>
          <div className="preview__actions">
            <button
              type="button"
              className="preview__button"
              onClick={() => setOpen(!open)}
            >
              {open ? 'Close sidebar' : 'Open sidebar'}
            </button>
            <span className="preview__hint">
              Preview mode uses <code>localStorage</code> instead of{' '}
              <code>chrome.storage</code>.
            </span>
          </div>
        </section>

        <section className="preview__grid">
          <article className="preview__card">
            <span className="preview__card-number">01</span>
            <h2>Shadow DOM isolation</h2>
            <p>
              Site CSS cannot reach the panel, and the panel cannot leak styles
              into the page. Critical host styles use inline{' '}
              <code>!important</code>.
            </p>
          </article>
          <article className="preview__card">
            <span className="preview__card-number">02</span>
            <h2>Real extension behaviour</h2>
            <p>
              Saving pages, theme, width, and motion settings persist to{' '}
              <code>chrome.storage.local</code>, with a preview fallback for
              local UI work.
            </p>
          </article>
          <article className="preview__card">
            <span className="preview__card-number">03</span>
            <h2>Small, readable base</h2>
            <p>
              Separate builds for the service worker and content script, no
              framework glue, and a single command to produce a loadable{' '}
              <code>dist/</code>.
            </p>
          </article>
        </section>

        <p className="preview__note">
          This page is only for UI development. The actual overlay runs from the
          built extension.
        </p>
      </main>

      <App />
    </>
  );
}

createRoot(document.getElementById('preview-root')!).render(
  <StrictMode>
    <PreviewPage />
  </StrictMode>,
);
