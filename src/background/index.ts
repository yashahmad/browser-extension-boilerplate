import { TOGGLE_SIDEBAR, type SidebarMessage } from '../shared/messages';

const RESTRICTED_PREFIXES = [
  'chrome:',
  'edge:',
  'about:',
  'devtools:',
  'view-source:',
  'chrome-extension:',
];

const WEB_STORE_URLS = [
  'https://chrome.google.com/webstore',
  'https://chromewebstore.google.com',
];

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
  } catch (error) {
    console.warn('[sidebar] Cannot open the sidebar on this page.', error);
  }
}

chrome.action.onClicked.addListener((tab) => {
  void toggleSidebar(tab);
});
