export type TsunamiOverlayState = {
  texts: string[];
  page: number;
  isCancelled: boolean;
};

export function createTsunamiOverlayState(): TsunamiOverlayState {
  return {
    texts: [],
    page: 0,
    isCancelled: true
  };
}

export function setTsunamiIssued(state: TsunamiOverlayState, texts: string[] | undefined) {
  state.isCancelled = false;
  state.texts = Array.isArray(texts) ? texts : [];
  state.page = 0;
}

export function setTsunamiCancelled(state: TsunamiOverlayState) {
  state.isCancelled = true;
  state.texts = [];
  state.page = 0;
}

export function advanceTsunamiPage(state: TsunamiOverlayState) {
  state.page += 1;
  if (state.texts.length <= state.page) {
    state.page = -5;
    return true;
  }
  return false;
}

export function renderTsunamiOverlay(params: {
  context: CanvasRenderingContext2D;
  colorScheme: any;
  colorThemeMode: number;
  fontSans: string;
  viewMode: number;
  viewType: number;
  state: TsunamiOverlayState;
  timeCount: number;
}) {
  const { context, colorScheme, colorThemeMode, fontSans, viewMode, viewType, state, timeCount } = params;
  if (state.isCancelled || viewMode === 1 || viewType !== 1) return false;

  const { page, texts } = state;

  if (page < 0 || viewMode === 3) {
    const colorAlpha = viewMode !== 2
      ? "ff"
      : ("0" + Math.min(255, Math.abs(Math.trunc((160 - (timeCount % 320)) * 2))).toString(16)).slice(-2);
    context.fillStyle = "#b33122" + colorAlpha;
    context.fillRect(815, 0, 265, 43);
    context.font = "500 30px " + fontSans;
    context.fillStyle = "#ffffff" + colorAlpha;
    context.textAlign = "end";
    context.fillText("津波情報を発表中", 1065, 33);
    context.textAlign = "start";
    return true;
  }

  context.fillStyle = "#b33122";
  context.fillRect(265, 0, 815, 60);
  context.font = "500 30px " + fontSans;
  context.fillStyle = "#fff";
  context.fillText("津波情報", 275, 33, 800);
  context.strokeStyle = "#fff";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(385, 55);
  context.lineTo(435, 5);
  context.stroke();

  const currentText = texts[page] ?? "";
  context.fillText(currentText, 420, 53, 610);
  context.font = "bold 20px 'Helvetica-Bold', 'HelveticaNeue', " + fontSans;
  context.textAlign = "center";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(1045, 25);
  context.lineTo(1075, 25);
  context.stroke();
  context.fillText((page + 1) + "", 1060, 21);
  context.fillText(texts.length + "", 1060, 43);
  context.textAlign = "start";
  return true;
}

export function updateTsunamiList(params: {
  element: HTMLElement;
  isIssued: boolean;
  issuedText: string;
  defaultText: string;
}) {
  const { element, isIssued, issuedText, defaultText } = params;
  element.style.color = isIssued ? "#ffff33" : "#ffffff";
  element.innerText = isIssued ? issuedText : defaultText;
}
