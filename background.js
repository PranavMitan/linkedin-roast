// This script runs in the background
console.log('LinkedIn Post Roaster: Background script initialized');

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated');
  // Initialize extension state
  chrome.storage.local.set({ roasterEnabled: false }, () => {
    if (chrome.runtime.lastError) {
      console.error('Failed to initialize state:', chrome.runtime.lastError);
      return;
    }
    console.log('Extension state initialized');
  });
});

// Listen for errors
self.addEventListener('error', (event) => {
  console.error('Service worker error:', event.error);
});

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  if (chrome.runtime.lastError) {
    console.error('Runtime error:', chrome.runtime.lastError);
  }
  return true;
}); 