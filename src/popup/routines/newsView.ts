export type NewsItem = {
  title: string;
  description?: string;
  detail: string;
  duration: number;
};

export type NewsOperatorDeps = {
  getViewMode: () => number;
  setMode: (mode: number) => void;
};

export const NewsOperator = {
  standby: [] as NewsItem[],
  endTime: 0,
  middleWidth: -1,
  viewDuration: 18000,
  DEFAULT_DURATION: 18000,
  viewing: {
    title: "",
    description: "",
    detail: "",
    duration: 0
  } as NewsItem,
  deps: undefined as NewsOperatorDeps | undefined,
  onUpdate: undefined as (() => void) | undefined,
  setDeps(deps: NewsOperatorDeps){
    this.deps = deps;
  },
  setOnUpdate(callback: () => void){
    this.onUpdate = callback;
  },
  clearAll: function (){
    this.standby = [];
    this.endTime = 0;
    this.middleWidth = -1;
    this.onUpdate?.();
  },
  next: function (){
    this.middleWidth = -1;
    this.endTime = 0;
    const currentMode = this.deps?.getViewMode?.();
    const nextItem = this.standby.shift();
    if (nextItem && currentMode !== 1){
      this.viewing.title = nextItem.title;
      this.viewing.description = nextItem.description;
      this.viewing.detail = nextItem.detail;
      this.viewDuration = nextItem.duration;

      this.endTime = Date.now() + this.viewDuration;
      if (this.deps?.setMode && currentMode !== 3) this.deps.setMode(3);
    }
    this.onUpdate?.();
    return !!this.endTime;
  },
  add: function (title?: string, description?: string, detail?: string, {repeat = 1, duration = 18000} = {}){
    const normalizedTitle = typeof title === "string" ? title : "";
    const normalizedDescription = typeof description === "string" ? description : undefined;
    const normalizedDetail = typeof detail === "string" ? detail : "";
    const normalizedDuration = Number.isFinite(duration) ? duration : this.DEFAULT_DURATION;

    for (let i = 0; i < repeat; i++){
      this.standby.push({
        title: normalizedTitle,
        description: normalizedDescription,
        detail: normalizedDetail,
        duration: normalizedDuration
      });
    }
    if (!this.endTime) this.next();
    else this.onUpdate?.();
  },
  /**
   * @return {Number} 1→0に
   */
  get progress (){
    return (this.endTime - Date.now()) / this.viewDuration;
  }
};

export type NewsRenderDeps = {
  context: CanvasRenderingContext2D;
  colorScheme: any;
  colorThemeMode: number;
  fontSans: string;
  strWidth: (text: string) => number;
  newsOperator: typeof NewsOperator;
};

export function renderNewsView({ context, colorScheme, colorThemeMode, fontSans, strWidth, newsOperator }: NewsRenderDeps){
  const newsProgress = newsOperator.progress;
  let started = false;
  let ended = false;

  if (newsProgress <= 0){
    if (newsOperator.next()){
      newsOperator.middleWidth = -1;
      started = true;
    } else {
      ended = true;
    }
  }

  if (newsOperator.viewing){
    const viewingDescription = newsOperator.viewing.description ?? "";
    const viewingDetail = newsOperator.viewing.detail ?? "";

    context.font = (viewingDescription ? 31 : 40) + "px " + fontSans;
    context.fillStyle = colorScheme[colorThemeMode][5][2];
    context.fillText(viewingDetail, 17, viewingDescription ? 122 : 110, 1046);
    context.fillStyle = colorScheme[colorThemeMode][5][2];
    context.font = "500 23px " + fontSans;
    if (newsOperator.middleWidth === -1) newsOperator.middleWidth = strWidth(viewingDescription);
    if (newsOperator.middleWidth * 0.8 < 1044){
      context.fillText(viewingDescription, 17, 88, newsOperator.middleWidth * 0.8);
    } else {
      const widthScaled = newsOperator.middleWidth * 0.8;
      const x = newsProgress > 0.88888888
        ? 17
        : newsProgress < 0.22222222
          ? 1063 - widthScaled + 17
          : ((1063 - widthScaled) * (800 - newsProgress * 900)) / 601 + 17;
      context.fillText(viewingDescription, x, 88, widthScaled);
    }
  }

  return { started, ended };
}

export function renderNewsTitle(params: {
  context: CanvasRenderingContext2D;
  colorScheme: any;
  colorThemeMode: number;
  mscale: number;
  fontSans: string;
  title: string;
}){
  const { context, colorScheme, colorThemeMode, mscale, fontSans, title } = params;
  context.fillStyle = colorScheme[colorThemeMode][1][mscale];
  context.fillRect(0, 0, 1080, 60);
  context.font = "42px " + fontSans;
  context.fillStyle = colorScheme[colorThemeMode][5][3][mscale];
  context.fillText(title, 35, 45, 1010);
}

export function renderNewsStandbyList(params: {
  standby: NewsItem[];
  messageEl: HTMLElement;
  tableBodyEl: HTMLElement;
}){
  const { standby, messageEl, tableBodyEl } = params;
  tableBodyEl.innerHTML = "";

  if (standby.length){
    messageEl.textContent = standby.length + "個の表示待機中の気象情報があります";
    for (let i = 0; i < standby.length; i++){
      const div1 = document.createElement("div");
      const div2 = document.createElement("div");
      const div3 = document.createElement("div");
      const div4 = document.createElement("div");
      const td1 = document.createElement("td");
      const td2 = document.createElement("td");
      const td3 = document.createElement("td");
      const td4 = document.createElement("td");
      const tr = document.createElement("tr");

      div1.textContent = standby[i].title;
      div2.textContent = standby[i].description ?? "";
      div3.textContent = standby[i].detail;
      div4.textContent = standby[i].duration + "ms";

      td1.className = "title";
      td2.className = "subtitle";
      td3.className = "maintext";
      td4.className = "newsDuration";
      td1.style.minWidth = "100px";
      td2.style.minWidth = "100px";
      td3.style.minWidth = "100px";

      td1.appendChild(div1);
      td2.appendChild(div2);
      td3.appendChild(div3);
      td4.appendChild(div4);
      tr.append(td1, td2, td3, td4);
      tableBodyEl.appendChild(tr);
    }
  } else {
    messageEl.textContent = "表示待機中の気象情報はありません";
  }
}
