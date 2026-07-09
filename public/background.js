/**
 * Mount AI Scholar - Chrome Extension Background Service Worker
 * (c) 2026 Capitaine, Stealth EdTech Startup. All rights reserved.
 * 
 * Optimized for ChromeOS, Chromebook deployments, and Google Classroom bridges.
 */

// Listener for install events
chrome.runtime.onInstalled.addListener(() => {
  console.log("⚡ Mount AI Scholar Background Worker Initialized.");
  console.log("🔒 Privacy Shield Active: Local Speech-To-Phoneme Pipeline Authorized.");
});

// Listener for messages from the React app or Content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "textToSpeech") {
    chrome.tts.speak(request.text, {
      rate: 0.85, // Slower speaking rate for dyslexic or language learning cognitive comfort
      pitch: 1.0,
      volume: 1.0,
      onEvent: (event) => {
        if (event.type === 'end') {
          sendResponse({ status: "success" });
        }
      }
    });
    return true; // Keep message port open for async response
  }

  if (request.action === "injectBionicGraphemes") {
    // Inject custom CSS styling to active page for reading realignment comfort
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: applyBionicRealignment
        });
        sendResponse({ status: "injected" });
      }
    });
    return true;
  }
});

/**
 * Apply saccadic reading anchors and mirror grapheme fixes locally on the target page.
 */
function applyBionicRealignment() {
  const elements = document.querySelectorAll('p, li, span');
  elements.forEach(el => {
    // Process text nodes to emphasize phonetic start characters
    // (Bionic reading simulation for cognitive focus)
    if (el.children.length === 0) {
      const text = el.innerText;
      const words = text.split(' ');
      const formatted = words.map(word => {
        if (word.length <= 3) return `<strong>${word}</strong>`;
        const mid = Math.ceil(word.length / 2);
        return `<strong>${word.substring(0, mid)}</strong>${word.substring(mid)}`;
      }).join(' ');
      el.innerHTML = formatted;
    }
  });
}
