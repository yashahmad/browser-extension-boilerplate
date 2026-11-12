import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  HOST_ID,
  isSidebarMessage,
} from '../shared/messages';
import { App } from './App';
import { toggleOpen } from './store';
import styles from './styles.css?inline';

// Critical host styles are set inline with !important so site CSS cannot move,
// hide, or resize the overlay. Everything inside lives in a shadow root.
const HOST_STYLES: Record<string, string> = {
  all: 'initial',
  position: 'fixed',
  inset: '0',
  width: '100%',
  height: '100%',
  display: 'block',
  margin: '0',
  padding: '0',
  border: '0',
  background: 'transparent',
  'z-index': '2147483647',
  overflow: 'hidden',
  'pointer-events': 'none',
};

let booted = false;

function boot(): void {
  if (booted) return;
  booted = true;

  // Remove a host left behind by a previous version of the extension.
  document.getElementById(HOST_ID)?.remove();

  const host = document.createElement('div');
  host.id = HOST_ID;

  for (const [property, value] of Object.entries(HOST_STYLES)) {
    host.style.setProperty(property, value, 'important');
  }

  const shadow = host.attachShadow({ mode: 'open' });

  // Constructable stylesheets bypass page CSP restrictions that can block
  // injected <style> elements.
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
    shadow.adoptedStyleSheets = [sheet];
  } catch {
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    shadow.append(styleElement);
  }

  const mountPoint = document.createElement('div');
  shadow.append(mountPoint);

  document.documentElement.append(host);

  createRoot(mountPoint).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (isSidebarMessage(message)) toggleOpen();
});

boot();
