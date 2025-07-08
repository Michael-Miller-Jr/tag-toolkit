chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'pageLoadComplete') {
        chrome.action.setPopup({ popup: 'popup.html' });
    }
});
