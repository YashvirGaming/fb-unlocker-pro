chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'DOWNLOAD_MEDIA' && message.url) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const prefix = message.mediaType === 'avatar' ? 'fb_avatar' : 'fb_cover';
    const filename = `${prefix}_${message.profileName || 'user'}_${timestamp}.jpg`;

    chrome.downloads.download(
      {
        url: message.url,
        filename: filename,
        saveAs: false
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true, downloadId });
        }
      }
    );

    return true;
  }
});
