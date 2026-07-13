import { TrafficTracker } from "../../ui/trafficTracker.ts";
import { AdditionalComments, translateMaxHeight } from "./common.ts";
import type { VTSE41 } from "../../../types/jma-json/qt/report-vtse41.js";
import type { VTSE51 } from "../../../types/jma-json/qt/report-vtse51.js";

type TsunamiText = {
  forecast_jp: string;
  forecast_en: string;
  obs_jp: string;
  obs_en: string;
  whole: string;
  head: string[];
  forecast_news: string[];
  obs_news: string[];
};

export type TsunamiEventType = "report";

type TsunamiReportDetail = {
  state: TsunamiOperator;
  vtse41?: string;
  vtse51?: string;
};

type TsunamiReportListener = (state: TsunamiOperator, vtse41?: string, vtse51?: string) => void;

export class TsunamiOperator extends EventTarget {
  private url_list = "https://www.jma.go.jp/bosai/tsunami/data/list.json";
  private list: any[] = [];
  private eventIdList41: string[] = [];
  private eventIdList51: string[] = [];
  private tracker_list = new TrafficTracker("JMA / Tsunami / list.json");
  private tracker_vtse41 = new TrafficTracker("JMA / Tsunami / VTSE41");
  private tracker_vtse51 = new TrafficTracker("JMA / Tsunami / VTSE51");

  forecasts: VTSE41.TsunamiForecastItem[] = [];
  earthquakes: any[] = [];
  expire = 0;
  warnLevel = 0;
  text: TsunamiText = {
    forecast_jp: "",
    forecast_en: "",
    obs_jp: "",
    obs_en: "",
    whole: "",
    head: [],
    forecast_news: [],
    obs_news: []
  };
  lastEventId = "";
  isIssued = false;

  subscribe (eventType: TsunamiEventType, listener: TsunamiReportListener){
    const eventListener: EventListener = (event) => {
      const detail = (event as CustomEvent<TsunamiReportDetail>).detail;
      listener(detail.state, detail.vtse41, detail.vtse51);
    };
    this.addEventListener(eventType, eventListener);
    return () => this.removeEventListener(eventType, eventListener);
  }

  notifyUpdate (vtse41?: string, vtse51?: string){
    this.dispatchEvent(new CustomEvent<TsunamiReportDetail>("report", { detail: { state: this, vtse41, vtse51 } }));
  }

  async load (): Promise<void> {
    if (this.isIssued && Date.now() - this.expire >= 0) this.isIssued = false;
    const list = await fetch(this.url_list, {
      cache: "no-cache"
    }).then(res => res.json());
    this.tracker_list.update();
    if (!list.length) return;
    const latestEventId = list[0].eid;
    let vtse41: string | undefined;
    let vtse51: string | undefined;
    for (const item of list){
      if (item.eid !== latestEventId) break;
      if (item.ift.includes("_K")) continue;
      const found = !(this.list.find(({ ctt }) => ctt === item.ctt));
      if (!found) continue;
      if (item.json.includes("VTSE41") && !vtse41) vtse41 = item.json;
      if (item.json.includes("VTSE51") && item.ttl === "津波観測に関する情報" && !vtse51) vtse51 = item.json;
      if (vtse41 && vtse51) break;
    }
    this.list = list;
    if (vtse41) this.isIssued = await this.vtse41(vtse41);
    if (this.isIssued && vtse51) await this.vtse51(vtse51);
    this.text.whole = this.text.forecast_jp + this.text.obs_jp + "\n\n" + this.text.forecast_en + this.text.obs_en;
    if (vtse41 || vtse51) this.notifyUpdate(vtse41, vtse51);
  }

  async vtse41 (filename: string): Promise<boolean> {
    const data = await fetch("https://www.jma.go.jp/bosai/tsunami/data/" + filename).then(res => res.json()) as VTSE41.Report;
    this.tracker_vtse41.update();
    this.earthquakes = data.Body.Earthquake;
    this.forecasts = data.Body.Tsunami.Forecast.Item;
    this.text.forecast_jp = "";
    this.text.forecast_en = "";
    this.text.head = [];
    let isAllCleared = true;
    let warnLevel = 0;
    this.text.forecast_news = [];
    const isFirstReport = !this.eventIdList41.includes(data.Head.EventID);
    if (isFirstReport) this.eventIdList41.push(data.Head.EventID);
    for (const item of this.forecasts){
      const { jp: maxHeightJP, en: maxHeightEN } = item.MaxHeight ? translateMaxHeight(item.MaxHeight?.TsunamiHeight, item.MaxHeight?.Condition ?? "", true) : { jp: "", en: "" };
      const arrivalTime = item.FirstHeight?.Condition ?? (item.FirstHeight ? new Date(item.FirstHeight.ArrivalTime).strftime("%H時%M分") : null);
      let categoryText = "";
      if (item.Category.Kind.Code === "52" || item.Category.Kind.Code === "53"){
        categoryText = "大津波警報";
        if (warnLevel < 4) warnLevel = 4;
      } else if (item.Category.Kind.Code === "51"){
        categoryText = "津波警報";
        if (warnLevel < 3) warnLevel = 3;
      } else if (item.Category.Kind.Code === "62"){
        categoryText = "津波注意報";
        if (warnLevel < 2) warnLevel = 2;
      } else if (item.Category.Kind.Code === "71" || item.Category.Kind.Code === "72" || item.Category.Kind.Code === "73"){
        categoryText = "津波予報";
        if (warnLevel < 1) warnLevel = 1;
      } else continue;
      const jpText = "【" + categoryText + "】 " + item.Area.Name + (maxHeightJP ? " " + maxHeightJP : "") + (arrivalTime ? " （" + arrivalTime + "）" : "");
      if (isFirstReport || item.MaxHeight?.Revise){
        this.text.forecast_news.push((item.MaxHeight?.Revise ? "［" + item.MaxHeight.Revise + "］ " : "") + jpText);
      }
      this.text.forecast_jp += "\n" + jpText;
      this.text.forecast_en += "\n* [" + (maxHeightEN ? maxHeightEN : "") + " Tsunami] is in " + item.Area.enName;
      this.text.head.push(item.Area.Name + (categoryText === "津波予報" ? "　若干の海面変動" : "") + (maxHeightJP ? " " + maxHeightJP : "") + (arrivalTime ? " (" + arrivalTime + ")" : "")) + "　 ";
      isAllCleared = false;
    }
    this.warnLevel = warnLevel;

    if (data.Body.Comments.WarningComment?.Code){
      data.Body.Comments.WarningComment.Code = data.Body.Comments.WarningComment.Code.replace("0121 0122 0123 0124", "0121").replace("0122 0123 0124", "0122").replace("0123 0124", "0123");
      for (const item of data.Body.Comments.WarningComment.Code.split(" ")){
        this.text.forecast_jp += "\n" + AdditionalComments[item].jp;
        this.text.forecast_en += "\n* " + AdditionalComments[item].en;
      }
    }

    if ("ValidDateTime" in data.Head && typeof data.Head.ValidDateTime === "string"){
      const validDate = new Date(data.Head.ValidDateTime);
      const validEpoch = validDate.getTime();
      if (Date.now() - validEpoch < 0){
        this.text.forecast_jp += "\n津波予報は" + validDate.strftime("%H時%M分") + "まで有効です。";
        this.text.forecast_en += "\n* Tsunami Forecast is in effect until " + validDate.strftime("%I:%M %p") + ".";
        this.expire = validEpoch - 0;
        return true;
      } else {
        return false;
      }
    } else {
      this.expire = 4102412400000;
      this.text.forecast_jp += "\n今後の情報にご注意ください。";
      this.text.forecast_en += "\n* Please stay tuned for further updates.";
      return !isAllCleared;
    }
  }

  async vtse51 (filename: string): Promise<void> {
    const data = await fetch("https://www.jma.go.jp/bosai/tsunami/data/" + filename).then(res => res.json()) as VTSE51.Report;
    this.tracker_vtse51.update();
    if (!data.Body.Tsunami.Observation) return;
    this.text.obs_jp = "";
    this.text.obs_en = "";
    this.text.obs_news = [];
    const isFirstReport = !this.eventIdList51.includes(data.Head.EventID);
    if (isFirstReport) this.eventIdList51.push(data.Head.EventID);
    for (const area of data.Body.Tsunami.Observation.Item){
      for (const item of area.Station){
        if (item.MaxHeight){
          const obsDate = ("DateTime" in item.MaxHeight && typeof item.MaxHeight.DateTime === "string") ? new Date(item.MaxHeight.DateTime) : null;
          const tsunamiHeight = ("TsunamiHeight" in item.MaxHeight && typeof item.MaxHeight.TsunamiHeight === "string") ? item.MaxHeight.TsunamiHeight : "";
          const maxHeight = translateMaxHeight(tsunamiHeight, item.MaxHeight.Condition ?? "");
          const jpText = (() => {
            if (item.MaxHeight.Condition && item.MaxHeight.Condition.includes("欠測")){
              return "【欠測】 " + item.Name + "（" + area.Area.Name + "） ";
            }
            return "【観測】 " + item.Name + "（" + area.Area.Name + "） " + (obsDate ? obsDate.strftime("%H時%M分") + " " : "") + maxHeight.jp;
          })();
          if (isFirstReport || item.MaxHeight.Revise){
            this.text.obs_news.push((item.MaxHeight.Revise ? "［" + item.MaxHeight.Revise + "］ " : "") + jpText);
          }
          this.text.obs_jp += "\n" + jpText;
          if (item.MaxHeight.Condition && item.MaxHeight.Condition.includes("欠測")){
            this.text.obs_en += "\n* [Data Failure] " + item.enName + ", " + area.Area.enName + ".";
          } else {
            this.text.obs_en += "\n* [Tsunami Observed] " + item.enName + ", " + area.Area.enName + ", " + maxHeight.en + ".";
          }
        } else if ("ArrivalTime" in item.FirstHeight){
          const reviseTranslation = { "更新": "Updated", "追加": "Added" };
          const obsDate = new Date(item.FirstHeight.ArrivalTime);
          const jpText = (item.FirstHeight.Revise ? "［" + item.FirstHeight.Revise + "］ " : "") + "【観測】 " + item.Name + "（" + area.Area.Name + "） " + obsDate.strftime("%H時%M分") + " " + item.FirstHeight.Initial;
          this.text.obs_news.push(jpText);
          this.text.obs_jp += "\n" + jpText;
          this.text.obs_en += "\n" + (item.FirstHeight.Revise ? "［" + reviseTranslation[item.FirstHeight.Revise] + "］ " : "") + "* [Tsunami Observed] " + item.enName + ", " + area.Area.enName + ", " + item.FirstHeight.Initial + ".";
        }
      }
    }
  }
}
