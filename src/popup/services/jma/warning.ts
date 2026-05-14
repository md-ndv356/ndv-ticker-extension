import { TrafficTracker } from "../../ui/trafficTracker.ts";
import type { AreaOperator } from "./common.ts";

export type WarnDataMapItem = {
  reportDateTime: string;
  areaTypes: {
    areas: {
      code: string;
      warnings: {
        code: string;
        status: string;
        nextKinds: {
          code: string;
          name: string;
        }[];
      }[];
    }[];
  }[];
  attentions: string[];
};

type WarnCurrentState = {
  area: any[];
  lastUpdated: number;
  text: string;
};

export type WarningEventType = "report";

type WarningReportDetail = {
  text: string;
};

type WarningReportListener = (text: string) => void;

export const WarnCodes: Record<string, { name1: string; name2: string; elem: string; level: number }> = {
  "33": { name1: "大雨", name2: "特別警報", elem: "rain", level: 50 },
  "03": { name1: "大雨", name2: "警報", elem: "rain", level: 30 },
  "10": { name1: "大雨", name2: "注意報", elem: "rain", level: 20 },
  "04": { name1: "洪水", name2: "警報", elem: "flood", level: 30 },
  "18": { name1: "洪水", name2: "注意報", elem: "flood", level: 20 },
  "35": { name1: "暴風", name2: "特別警報", elem: "wind", level: 40 },
  "05": { name1: "暴風", name2: "警報", elem: "wind", level: 30 },
  "15": { name1: "強風", name2: "注意報", elem: "wind", level: 20 },
  "32": { name1: "暴風雪", name2: "特別警報", elem: "wind_snow", level: 40 },
  "02": { name1: "暴風雪", name2: "警報", elem: "wind_snow", level: 30 },
  "13": { name1: "風雪", name2: "注意報", elem: "wind_snow", level: 20 },
  "36": { name1: "大雪", name2: "特別警報", elem: "snow", level: 40 },
  "06": { name1: "大雪", name2: "警報", elem: "snow", level: 30 },
  "12": { name1: "大雪", name2: "注意報", elem: "snow", level: 20 },
  "37": { name1: "波浪", name2: "特別警報", elem: "wave", level: 40 },
  "07": { name1: "波浪", name2: "警報", elem: "wave", level: 30 },
  "16": { name1: "波浪", name2: "注意報", elem: "wave", level: 20 },
  "38": { name1: "高潮", name2: "特別警報", elem: "tide", level: 40 },
  "08": { name1: "高潮", name2: "警報", elem: "tide", level: 40 },
  "19": { name1: "高潮", name2: "注意報", elem: "tide", level: 20 },
  "19+": { name1: "高潮", name2: "注意報", elem: "tide", level: 30 },
  "14": { name1: "雷", name2: "注意報", elem: "thunder", level: 20 },
  "17": { name1: "融雪", name2: "注意報", elem: "snow_melting", level: 20 },
  "20": { name1: "濃霧", name2: "注意報", elem: "fog", level: 20 },
  "21": { name1: "乾燥", name2: "注意報", elem: "dry", level: 20 },
  "22": { name1: "なだれ", name2: "注意報", elem: "avalanche", level: 20 },
  "23": { name1: "低温", name2: "注意報", elem: "cold", level: 20 },
  "24": { name1: "霜", name2: "注意報", elem: "frost", level: 20 },
  "25": { name1: "着氷", name2: "注意報", elem: "ice_accretion", level: 20 },
  "26": { name1: "着雪", name2: "注意報", elem: "snow_accretion", level: 20 },
};

export class WarnCurrentOperator extends EventTarget {
  private url = "https://www.jma.go.jp/bosai/warning/data/warning/map.json";
  private tracker = new TrafficTracker("JMA / Warning / map.json");
  private readonly areaOperator: AreaOperator;

  data: WarnCurrentState = {
    area: [],
    lastUpdated: 0,
    text: "（＊サンプル文章＊）（＊サンプル文章＊）　【セイライ島】 大雨警報・雷注意報　　【下風蝕地】 乾燥注意報　　【フォンテーヌ邸地区】 大雨特別警報・洪水危険警報・波浪警報　（インターネット接続を確認してください）"
  };

  constructor (areaOperator: AreaOperator){
    super();
    this.areaOperator = areaOperator;
  }

  subscribe (eventType: WarningEventType, listener: WarningReportListener){
    const eventListener: EventListener = (event) => {
      const detail = (event as CustomEvent<WarningReportDetail>).detail;
      listener(detail.text);
    };
    this.addEventListener(eventType, eventListener);
    return () => this.removeEventListener(eventType, eventListener);
  }

  notifyUpdate (text: string){
    this.dispatchEvent(new CustomEvent<WarningReportDetail>("report", { detail: { text } }));
  }

  async load(){
    const AreaData = await this.areaOperator.getData();
    await fetch(this.url + "?_=" + Date.now()).then(async res => {
      this.tracker.update();

      const lastModified = new Date(res.headers.get("Last-Modified") as string).getTime() / 1000;
      if (this.data.lastUpdated === lastModified) return null;

      const warnList: string[] = [];
      const WarnData = await res.json() as WarnDataMapItem[];
      for (const item of WarnData){
        for (const area of item.areaTypes[0].areas){
          if (area.warnings[0].status === "発表警報・注意報はなし") continue;
          const warnings = area.warnings.filter(item => {
            if (item.code === "19" && item.nextKinds) item.code = "19+";
            return item.status !== "解除";
          }).map(item => {
            const warn = WarnCodes[item.code];
            return warn.name1 + warn.name2;
          }).join("・");
          if (!warnings) continue;

          const class10s = AreaData.class10s[area.code];
          const offices = AreaData.offices[class10s.parent];
          const head2 = area.code.slice(0, 2);
          const pointName = ((["13", "27", "37"].includes(head2) || ["460030", "472000", "473000", "474010", "474020"].includes(area.code)) ? "" : (["01", "46", "47"].includes(head2) ? {"01": "北海道", "46": "鹿児島県", "47": "沖縄県"}[head2] : offices.name)) + class10s.name;

          warnList.push("【" + pointName + "】 " + warnings + (item.attentions ? "（" + item.attentions.join("・") + "）" : ""));
        }
      }
      this.notifyUpdate(this.data.text = warnList.join("　　"));
      this.data.lastUpdated = lastModified;
    });
  }
}
