import { TrafficTracker } from "../../ui/traffic-tracker.ts";
import { zen2han } from "./common.ts";

export type TyphReportListItem = {
  controlTitle: string;
  datetime: string;
  editorialOffice: string;
  publishingOffice: string;
  headTitle: string;
  reportDateTime: string;
  targetDateTime: string;
  eventId: string;
  infoType: "発表";
  serial: string;
  fileName: string;
  header: string;
};

export type TcCodeListItem = {
  tropicalCyclone: string;
  typhoonNumber: string;
  category: string;
  issue: string;
};

type TyphCommentEntry = {
  lastUpdated: number;
  comment: string;
  number: number;
};

export type TyphoonEventType = "report";

type TyphoonReportDetail = {
  state: TyphCommentOperator;
};

type TyphoonReportListener = (state: TyphCommentOperator) => void;

export class TyphCommentOperator extends EventTarget {
  private url_info = "https://www.jma.go.jp/bosai/information/data/typhoon.json";
  private url_typh = "https://www.jma.go.jp/bosai/typhoon/data/targetTc.json";
  private tracker_info = new TrafficTracker("JMA / Typhoon / typhoon.json");
  private tracker_typh = new TrafficTracker("JMA / Typhoon / targetTc.json");
  private tracker_vpti51 = new TrafficTracker("JMA / Typhoon / VPTI51");

  data: Record<string, TyphCommentEntry> = {
    TC0101: {
      lastUpdated: 1234567890,
      comment: "あいう",
      number: 0
    }
  };

  subscribe (eventType: TyphoonEventType, listener: TyphoonReportListener){
    const eventListener: EventListener = (event) => {
      const detail = (event as CustomEvent<TyphoonReportDetail>).detail;
      listener(detail.state);
    };
    this.addEventListener(eventType, eventListener);
    return () => this.removeEventListener(eventType, eventListener);
  }

  notifyUpdate (){
    this.dispatchEvent(new CustomEvent<TyphoonReportDetail>("report", { detail: { state: this } }));
  }

  async load(){
    const infolist = await fetch(this.url_info + "?_=" + Date.now()).then(res => res.json()) as TyphReportListItem[];
    this.tracker_info.update();

    const typhlist = await fetch(this.url_typh + "?_=" + Date.now()).then(res => res.json()) as TcCodeListItem[];
    this.tracker_typh.update();

    let isUpdated = false;
    for (let i = infolist.length; i; i--){
      const item = infolist[i-1];
      const epoch = new Date(item.datetime).getTime() - 0;
      if (item.header !== "VPTI51") continue;
      if (this.data[item.eventId] && this.data[item.eventId].lastUpdated >= epoch) continue;
      const { comment } = await this.vpti51(item.fileName);
      const typhNumber = Number((typhlist.find(candidate => item.eventId === candidate.tropicalCyclone)?.typhoonNumber ?? "0").slice(-2));
      this.data[item.eventId] = {
        lastUpdated: epoch,
        comment,
        number: typhNumber
      };
      isUpdated = true;
    }
    if (isUpdated) this.notifyUpdate();
  }

  async vpti51(filename: string){
    const data = await fetch("https://www.jma.go.jp/bosai/information/data/typhoon/" + filename).then(res => res.json());
    this.tracker_vpti51.update();
    return {
      headline: zen2han(data.headlineText.trim()),
      comment: zen2han(data.commentText.replace(/\n/g, "").trim())
    };
  }
}
