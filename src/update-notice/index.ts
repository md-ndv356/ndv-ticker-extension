// アップデート通知ページ。クエリパラメータで渡された情報を表示する。
// txt: リリースノート (markdown) / app: 現在のバージョン / new: 最新バージョン / url: ジャンプ先
import { marked } from "marked";

const urlParams = new URLSearchParams(window.location.search);
const obj = Object.fromEntries(urlParams.entries());

const content = decodeURIComponent(obj.txt ?? "");

const currentElement = document.getElementById("current") as HTMLParagraphElement;
const latestElement = document.getElementById("latest") as HTMLParagraphElement;
const contentElement = document.getElementById("content") as HTMLDivElement;

currentElement.innerText = decodeURIComponent(obj.app ?? "");
latestElement.innerText = decodeURIComponent(obj.new ?? "");

// setHTML が使える環境ではサニタイズ付きで markdown を描画し、使えなければプレーンテキストで表示する
type ElementWithSetHTML = HTMLElement & { setHTML?: (html: string) => void };
const contentWithSetHTML = contentElement as ElementWithSetHTML;
if (contentWithSetHTML.setHTML){
  contentWithSetHTML.setHTML(marked.parse(content, { async: false }));
} else {
  contentElement.innerText = content;
  contentElement.style.whiteSpace = "pre-wrap";
  contentElement.style.fontFamily = "monospace";
}

const linkElement = document.querySelector("a");
if (linkElement) linkElement.href = decodeURIComponent(obj.url ?? "#");
