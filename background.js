/**
 * background.js
 * Service worker for Morse Code Picture Translator Chrome Extension (MV3).
 * Manages context menu integration and full-tab studio launching.
 */

// Initialize Context Menus on installation
chrome.runtime.onInstalled.addListener(() => {
  // Menu for selected text on any webpage
  chrome.contextMenus.create({
    id: 'translate-selection-morse',
    title: 'Translate "%s" to Morse Code',
    contexts: ['selection']
  });

  // Menu for general page / action right-click
  chrome.contextMenus.create({
    id: 'open-morse-studio',
    title: 'Open Morse Picture Translator Studio',
    contexts: ['page', 'action']
  });
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'translate-selection-morse' && info.selectionText) {
    // Store selected text for the extension to consume on load
    chrome.storage.local.set({ pendingText: info.selectionText.trim() }, () => {
      chrome.tabs.create({ url: 'fulltab.html' });
    });
  } else if (info.menuItemId === 'open-morse-studio') {
    chrome.tabs.create({ url: 'fulltab.html' });
  }
});
