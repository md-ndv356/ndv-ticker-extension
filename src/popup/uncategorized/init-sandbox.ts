import type { ConnectToSandbox } from "../data/japan";
type ResolveFn = (value: number) => void;
type RejectFn = (reason?: unknown) => void;

const messageStatus: { resolve: ResolveFn | null; reject: RejectFn | null; isConnect: boolean } = {
  resolve: null,
  reject: null,
  isConnect: false
};

window.addEventListener("message", event => {
  if (!messageStatus.isConnect) return;
  messageStatus.isConnect = false;
  messageStatus.resolve?.(event.data as number);
  // reset listeners after handling a single response
  messageStatus.resolve = null;
  messageStatus.reject = null;
});

const getSandboxWindow = () => (document.getElementById("sandbox-webassembly") as HTMLIFrameElement | null)?.contentWindow ?? null;

export const connect2sandbox: ConnectToSandbox = (type, message) => new Promise((resolve, reject) => {
  if (messageStatus.isConnect) {
    reject(new Error("Sandbox is busy"));
    return;
  }
  const targetWindow = getSandboxWindow();
  if (!targetWindow) {
    reject(new Error("Sandbox iframe not ready"));
    return;
  }
  const sendData = { type, main: message };
  messageStatus.isConnect = true;
  messageStatus.resolve = resolve;
  messageStatus.reject = reject;
  targetWindow.postMessage(sendData, "*");
});

// keep legacy global for existing callers
window.connect2sandbox = connect2sandbox;

declare global {
  interface Window {
    connect2sandbox: ConnectToSandbox;
  }
}
