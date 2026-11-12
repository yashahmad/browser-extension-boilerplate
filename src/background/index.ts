import { TOGGLE_SIDEBAR, type SidebarMessage } from '../shared/messages';

const RESTRICTED_PREFIXES = [
  'chrome:',
  'edge:',
  'about:',
  'devtools:',
  'view-source:',
  'chrome-extension:',
  'safari:',
  'safari-extension:',
  'safari-web-extension:',
];

const WEB_STORE_URLS = [
  'https://chrome.google.com/webstore',
  'https://chromewebstore.google.com',
];

const ACTION_TITLE = 'Toggle sidebar (Alt+Shift+S)';
const ACCESS_ERROR_TITLE =
  'Sidebar: allow this website in Settings > Extensions, then try again';

let showingAccessError = false;

async function setActionState(
  badge: string,
  title: string,
  color?: string,
): Promise<void> {
  const calls: Promise<unknown>[] = [
    chrome.action.setBadgeText({ text: badge }),
    chrome.action.setTitle({ title }),
  ];
  if (color) calls.push(chrome.action.setBadgeBackgroundColor({ color }));
  await Promise.allSettled(calls);
}

async function showAccessError(): Promise<void> {
  if (showingAccessError) return;
  showingAccessError = true;
  // Safari shows the toolbar badge and title, which makes a failed
  // injection visible instead of silently doing nothing.
  await setActionState('!', ACCESS_ERROR_TITLE, '#b42318');
}

async function clearAccessError(): Promise<void> {
  if (!showingAccessError) return;
  showingAccessError = false;
  await setActionState('', ACTION_TITLE);
}

function isRestrictedPage(url: string | undefined): boolean {
  if (!url) return false;
  return (
    RESTRICTED_PREFIXES.some((prefix) => url.startsWith(prefix)) ||
    WEB_STORE_URLS.some((storeUrl) => url.startsWith(storeUrl))
  );
}

async function toggleSidebar(tab: chrome.tabs.Tab): Promise<void> {
  if (tab.id === undefined || isRestrictedPage(tab.url)) return;

  const message: SidebarMessage = { type: TOGGLE_SIDEBAR };

  try {
    await chrome.tabs.sendMessage(tab.id, message);
    await clearAccessError();
    return;
  } catch {
    // The content script is missing on tabs that were already open when the
    // extension was installed or reloaded. Inject it, then toggle.
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });
    await chrome.tabs.sendMessage(tab.id, message);
    await clearAccessError();
  } catch (error) {
    console.warn('[sidebar] Cannot open the sidebar on this page.', error);
    await showAccessError();
  }
}

chrome.action.onClicked.addListener((tab) => {
  void toggleSidebar(tab);
});
