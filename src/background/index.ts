import * as storageProvider from "./storage";

let windowId: number | null = null;

chrome.action.onClicked.addListener(async () => {
  if (windowId !== null) {
    chrome.windows.update(windowId, { focused: true });
  } else {
    const id = await chrome.windows.create({
      url: chrome.runtime.getURL("src/popup/index.html"),
      type: "popup",
      width: 1280,
      height: 640
    });
    if (id && id.id) {
      windowId = id.id;
    }
  }
});

chrome.windows.onRemoved.addListener((closedWindowId) => {
  if (windowId === closedWindowId) {
    windowId = null;
  }
});

// ポップアップから設定変更の通知を受け取る
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.type === "getStorage"){
    storageProvider.read().then((value) => {
      sendResponse({ status: "success", value: value });
    }).catch((error) => {
      sendResponse({ status: "error", error: error.message });
    });
    return true; // 非同期でsendResponseを呼び出すことを示す
  }

  if (message.type === "updateConfig"){
    storageProvider.setValue(message.key, message.value).then(() => {
      sendResponse({ status: "success" });
    }).catch((error) => {
      sendResponse({ status: "error", error: error.message });
    });
    return true; // 非同期でsendResponseを呼び出すことを示す
  }
});
