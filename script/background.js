chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type } = message;

  switch (type) {
    case 'set':
      handleSet(sendResponse);
      break;

    case 'open':
      handleOpen(message, sendResponse);
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

function handleSet(sendResponse) {
  sendResponse({});
}

async function handleOpen(message, sendResponse) {
  const { url, region } = message;

  const targetUrl = url.replaceAll('{{REGION}}', region);

  await chrome.tabs.create({ url: targetUrl });
  await chrome.storage.local.set({ region });

  sendResponse({});
}