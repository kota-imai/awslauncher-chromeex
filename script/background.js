chrome.runtime.onMessage.addListener(
  function (message, sender, sendResponse) {
    // Start service worker before the request
    if (message.type === 'set') {
      sendResponse({});
    }
    // open URL in another tab
    if (message.type === 'open') {
      const url = message.url.replaceAll('{{REGION}}', message.region);
      chrome.tabs.create({ url: url });
      sendResponse({ status: 'ok' });
    }
  }
) 