chrome.runtime.onMessage.addListener(
    function (message, sender, sendResponse) {
        // console.log(message);
        if (message.type === 'open') {
            const url = message.url.replaceAll('{{REGION}}', message.region);
            chrome.tabs.create({ url: url });
            sendResponse({status: 'ok'});   
        }
    }
)