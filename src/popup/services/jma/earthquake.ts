import type { QT } from "../../../types/jma-json/qt/components.d.ts";
import type { QuakeList } from "../../../types/jma-json/qt/quake-list.d.ts";
import type { VXSE51 } from "../../../types/jma-json/qt/report-vxse51.d.ts";
import type { VXSE52 } from "../../../types/jma-json/qt/report-vxse52.d.ts";
import type { VXSE53 } from "../../../types/jma-json/qt/report-vxse53.d.ts";
import type { VXSE61 } from "../../../types/jma-json/qt/report-vxse61.d.ts";
import { TrafficTracker } from "../../ui/trafficTracker.ts";
import { epicenter_list } from "../../dictionaries/epicenter.ts";
import { AdditionalComments } from "./common.ts";

/** 地震一覧に表示する 1 イベント分の要約情報 */
export type QuakeSummary = {
  label: {
    epicenter: string;
    intensity: string;
    time: string;
  };
  backcolor: string;
  textcolor: string;
};

/** ja / en のペア */
type BilingualText = [string, string];

/** 選択されたイベントの詳細情報（ティッカー表示・読み上げに使う） */
export type QuakeDetail = {
  summaryText: {
    time: BilingualText;
    intensity: BilingualText;
    epicenter: BilingualText;
    magnitude: BilingualText;
    depth: BilingualText;
    comment: BilingualText;
    freeFormComment: string;
  };
  /** インデックス = 震度リスト番号。0 番は地震に関する基本情報をまとめた文章 */
  shindoOneline: string[];
  shindoMultiline: string;
  maxShindo: number;
  timeStr: string;
  isSokuho: boolean;
  epicenterIndex: number;
  epicenterName: string;
  depthStr: string;
  magnitude: string;
  speechList: { type: string; path: string }[];
};

type QuakeEventData = {
  summary: QuakeSummary;
  detail: QuakeDetail | null;
};

type SummaryEntry = { summary: QuakeSummary | undefined; eventId: string };

const detailBaseUrl = "https://www.jma.go.jp/bosai/quake/data/";

/**
 * JMA bosai の地震情報（list.json + VXSE51/52/5k/5e/61）を取得・整形するオペレータ。
 * loadList() で新着電文を検出し、activate() で選択イベントの詳細を組み立てて
 * onSummaryUpdated / onActivated のコールバックに渡す。
 */
export class EarthquakeOperator {
  url_list = "https://www.jma.go.jp/bosai/quake/data/list.json";
  tracker_list = new TrafficTracker("JMA / Quake / list.json", false);

  shindo_list: Record<string, number> = { "1": 1, "2": 2, "3": 3, "4": 4, "震度５弱以上未入電": 5, "5-": 6, "5+": 7, "6-": 8, "6+": 9, "7": 10 };
  magnitude_not_a_number: Record<string, number> = { "M不明": -901, "M8を超える巨大地震": -902, "Ｍ不明": -901, "Ｍ８を超える巨大地震": -902 };

  initialized = false; // 初期化時にだけfalse
  stockedJsonList: string[] = [];
  eventSource: Record<string, string[]> = {};
  quakeData: Record<string, QuakeEventData> = {};

  /** 一覧が更新されたときに呼ばれる。GUI 側で差し替える */
  onSummaryUpdated: (summaries: SummaryEntry[]) => void = summaries => {
    console.log(summaries);
  };

  /** イベントが選択（アクティブ化）されたときに呼ばれる。GUI 側で差し替える */
  onActivated: (eventId: string, detail: QuakeDetail) => void = (eventId, detail) => {
    console.log("Activated Event ID:", eventId);
    console.log(detail);
  };

  /** 地震一覧 (list.json) を取得し、新しい電文を検出したら summary を組み立てる */
  async loadList (){
    const summaryBackcolor = ["#fff", "#f2f2ff", "#68c8fd", "#869ffd", "#94f481", "#555", "#faf500", "#ffc27c", "#d12000", "#a50021", "#85004d"];
    const summaryTextColor = ["#444", "#333", "#333", "#333", "#333", "#fff", "#333", "#333", "#fff", "#fff", "#fff"];
    const intensityText = ["不明", "1", "2", "3", "4", "不明", "5弱", "5強", "6弱", "6強", "7"];

    let isUpdateAvailable = false;
    const list = await fetch(this.url_list, {
      cache: "no-cache"
    }).then(res => res.json()) as QuakeList.QuakeList;
    this.tracker_list.update();

    const targetEventIds: string[] = [];
    for (const info of list.toReversed()){
      if (!(info.json.includes("VXSE51") ||
        info.json.includes("VXSE52") ||
        info.json.includes("VXSE5k") ||
        info.json.includes("VXSE5e") ||
        info.json.includes("VXSE61"))) continue;
      if (info.ift.includes("_K")) continue; // 訓練情報
      targetEventIds.push(info.eid);
      if (this.stockedJsonList.includes(info.json)) continue;
      this.stockedJsonList.push(info.json);

      if (this.initialized) console.log("New file detected: ", info.json);

      // 分類
      if (!Object.hasOwn(this.eventSource, info.eid)) this.eventSource[info.eid] = [];
      this.eventSource[info.eid].push(info.json);

      // summary 作成
      if (!Object.hasOwn(this.quakeData, info.eid)){
        this.quakeData[info.eid] = {
          summary: {
            label: {
              epicenter: "",
              intensity: "",
              time: ""
            },
            backcolor: "#444a",
            textcolor: "#fffa"
          },
          detail: null
        };
      }
      // detail は常に最新の情報を取得するため、初期化しておく
      this.quakeData[info.eid].detail = null;

      const arrivalTime = new Date(info.at);
      this.quakeData[info.eid].summary.label.time = `${arrivalTime.getDate()}日${arrivalTime.getHours()}時${arrivalTime.getMinutes()}分 ${info.ift.includes("VXSE5e") ? "検知" : "発生"}`;
      isUpdateAvailable = true;

      if (info.anm){
        this.quakeData[info.eid].summary.label.epicenter = info.anm;
      }
      if (info.maxi){
        const intensityIndex = this.shindo_list[info.maxi] ?? 0;
        this.quakeData[info.eid].summary.label.intensity = "最大震度" + intensityText[intensityIndex];
        this.quakeData[info.eid].summary.backcolor = summaryBackcolor[intensityIndex];
        this.quakeData[info.eid].summary.textcolor = summaryTextColor[intensityIndex];
      } else if (info.json.includes("VXSE5e")){
        this.quakeData[info.eid].summary.label.intensity = "海外の地震";
        this.quakeData[info.eid].summary.backcolor = summaryBackcolor[0];
        this.quakeData[info.eid].summary.textcolor = summaryTextColor[0];
      }
    }

    // 一覧の並び順（新しい順）を保ったままイベント ID の重複を除去して通知する
    if (isUpdateAvailable) this.onSummaryUpdated(Array.from(new Set(targetEventIds.toReversed())).map(eid => {
      return { summary: this.quakeData[eid]?.summary, eventId: eid };
    }));
    if (this.initialized && isUpdateAvailable) this.activate(list[0].eid).then(result => console.log("Activated event " + list[0].eid + ": " + (result ? "success" : "failure")));
    this.initialized = true;
  }

  /**
   * イベントをアクティブ化する。detail が未取得なら必要な電文を取得して組み立て、
   * onActivated に渡す。
   * @param eventId Event ID
   */
  async activate (eventId: string){
    if (!Object.hasOwn(this.quakeData, eventId)){
      return false;
    } else if (this.quakeData[eventId].detail === null){
      // 情報の取得を行う
      this.quakeData[eventId].detail = {
        summaryText: {
          time: ["", ""],
          intensity: ["", ""],
          epicenter: ["", ""],
          magnitude: ["", ""],
          depth: ["", ""],
          comment: ["", ""],
          freeFormComment: ""
        },
        shindoOneline: new Array(11).fill(""),
        shindoMultiline: "",
        maxShindo: 0,
        timeStr: "",
        isSokuho: true,
        epicenterIndex: epicenter_list[12].indexOf("///"),
        epicenterName: epicenter_list[0][epicenter_list[12].indexOf("///")],
        depthStr: "--",
        magnitude: "--",
        speechList: []
      };

      // 必要なデータを探す（無駄にリクエストしないために）
      const necessarySources: string[] = [];
      let hasEpicenter = false, hasShindo = false;
      for (let i = this.eventSource[eventId].length - 1; i >= 0; i--){
        const url = this.eventSource[eventId][i];
        if (url.includes("VXSE5k")){
          necessarySources.unshift(url);
          hasEpicenter = true;
          hasShindo = true;
        } else if (url.includes("VXSE52") || url.includes("VXSE5e") || url.includes("VXSE61")){
          necessarySources.unshift(url);
          hasEpicenter = true;
        } else if (url.includes("VXSE51")){
          necessarySources.unshift(url);
          hasShindo = true;
        }
        if (hasEpicenter && hasShindo) break;
      }

      // 必要なデータを取得
      for (const url of necessarySources){
        if (url.includes("VXSE51")) await this.vxse51(url);
        else if (url.includes("VXSE52")) await this.vxse52(url);
        else if (url.includes("VXSE5k")) await this.vxse5k(url);
        else if (url.includes("VXSE5e")) await this.vxse5e(url);
        else if (url.includes("VXSE61")) await this.vxse61(url);
      }
    }

    this.onActivated(eventId, this.quakeData[eventId].detail as QuakeDetail);
    return true;
  }

  /**
   * 座標文字列（"+35.7-139.7-10000/" 形式）を数値の配列にする
   * @returns [latitude, longitude, depth?]
   */
  private parseCoordinate (coordinate: string): number[] {
    return coordinate.replace(/\/$/m, "").split(/(?=[\-+])/g).map(item => Number(item));
  }

  /** WGS 座標があればそちらを優先して返す（VXSE61 の震源要素更新など） */
  private pickCoordinate (area: QT.HypocenterArea): string {
    const areaWithWGS = area as Partial<{ Coordinate_WGS: string }> & QT.HypocenterArea;
    return areaWithWGS.Coordinate_WGS || area.Coordinate;
  }

  /** 震度速報 */
  async vxse51 (url: string): Promise<QuakeDetail> {
    const data = await fetch(detailBaseUrl + url).then(res => res.json()) as VXSE51.Report;
    const eventId = data.Head.EventID;
    const detail = this.quakeData[eventId].detail as QuakeDetail;

    const observation = (data.Body.Intensity as QT.Intensity).Observation;
    detail.maxShindo = this.shindo_list[observation.MaxInt] ?? 0;
    detail.timeStr = new Date(data.Head.TargetDateTime).strftime("%Y-%m-%d %H:%M");

    const shindoList: string[][] = new Array(11).fill(0).map(() => ([])); // 震度速報は都道府県別にしない
    for (const pref of observation.Pref){
      for (const area of pref.Area){
        const maxIntIndex = this.shindo_list[area.MaxInt];
        shindoList[maxIntIndex].push(area.Name);
      }
    }

    detail.shindoOneline = shindoList.map((areaList, index) => {
      if (index === 0) return ""; // 地震に関する基本情報をまとめる場所

      return areaList.join("　");
    });
    detail.shindoMultiline = shindoList.reverse().map((areaList, index) => {
      const intensityLabel = ["震度７", "震度６強", "震度６弱", "震度５強", "震度５弱", "震度５弱以上と推定", "震度４", "震度３", "震度２", "震度１", "不明"][index]; // 逆順にするのを考慮

      if (Object.keys(areaList).length === 0) return "";
      return `［${intensityLabel}］\n　` + areaList.map(area => `${area}`).join("　");
    }).filter(Boolean).join("\n");

    // TODO: 読み上げ
    detail.speechList = [];

    detail.shindoOneline[0] = this.makeSummaryText(data.Head.EventID, data, ["time", "intensity", "comment"]);

    return detail;
  }

  /** 震源情報 */
  async vxse52 (url: string, updateComment = true): Promise<QuakeDetail> {
    const data = await fetch(detailBaseUrl + url).then(res => res.json()) as VXSE52.Report | VXSE53.Overseas.Report | VXSE61.Report;
    const eventId = data.Head.EventID;
    const detail = this.quakeData[eventId].detail as QuakeDetail;

    const earthquake = data.Body.Earthquake as QT.Earthquake;
    detail.timeStr = new Date(earthquake.OriginTime).strftime("%Y-%m-%d %H:%M");
    detail.epicenterIndex = epicenter_list[12].indexOf(earthquake.Hypocenter.Area.Code);
    detail.epicenterName = this.makeEpicenterText(earthquake.Hypocenter);
    const coordinates = this.parseCoordinate(this.pickCoordinate(earthquake.Hypocenter.Area));
    detail.depthStr = coordinates.length === 2 ? "--" : (coordinates[2] === 0 ? "ごく浅い" : (coordinates[2] === -700000 ? "深い" : (-coordinates[2] / 1000) + ""));
    detail.magnitude = (earthquake.Magnitude === "Ｍ不明") ? "" : (earthquake.Magnitude === "Ｍ８を超える巨大地震") ? "8+" : earthquake.Magnitude;

    detail.shindoOneline[0] = this.makeSummaryText(data.Head.EventID, data, ["time", "epicenter", "magnitude", "depth", ...(
      updateComment ? ["comment" as const] : []
    )]);

    return detail;
  }

  /** 地震情報（震源・震度に関する情報） */
  async vxse5k (url: string): Promise<QuakeDetail> {
    const data = await fetch(detailBaseUrl + url).then(res => res.json()) as VXSE53.Domestic.Report;
    const eventId = data.Head.EventID;
    const detail = this.quakeData[eventId].detail as QuakeDetail;

    const earthquake = data.Body.Earthquake as QT.Earthquake;
    detail.timeStr = new Date(earthquake.OriginTime).strftime("%Y-%m-%d %H:%M");
    detail.epicenterIndex = epicenter_list[12].indexOf(earthquake.Hypocenter.Area.Code);
    detail.epicenterName = this.makeEpicenterText(earthquake.Hypocenter);
    const coordinates = this.parseCoordinate(this.pickCoordinate(earthquake.Hypocenter.Area));
    detail.depthStr = coordinates.length === 2 ? "--" : (coordinates[2] === 0 ? "ごく浅い" : (coordinates[2] === -700000 ? "深い" : (-coordinates[2] / 1000) + ""));
    detail.magnitude = (earthquake.Magnitude === "Ｍ不明") ? "--" : (earthquake.Magnitude === "Ｍ８を超える巨大地震") ? "8+" : earthquake.Magnitude;
    detail.isSokuho = false;
    const observation = (data.Body.Intensity as QT.Intensity | undefined)?.Observation;
    if (observation){
      detail.maxShindo = this.shindo_list[observation.MaxInt];

      const prefShindoList: Record<string, string[]>[] = new Array(11).fill(0).map(() => ({}));
      for (const pref of observation.Pref){
        for (const area of pref.Area){
          if (!area.City) continue;
          for (const city of area.City){
            const maxIntIndex = this.shindo_list[city.MaxInt];
            if (!Object.hasOwn(prefShindoList[maxIntIndex], pref.Name)){
              prefShindoList[maxIntIndex][pref.Name] = [];
            }
            prefShindoList[maxIntIndex][pref.Name].push(city.Name);
          }
        }
      }

      detail.shindoOneline = prefShindoList.map((prefShindo, index) => {
        if (index === 0) return ""; // 地震に関する基本情報をまとめる場所

        return Object.entries(prefShindo).map(([prefName, areas]) => {
          return `［${prefName}］ ${areas.join(" ")}`;
        }).join("　　");
      });
      detail.shindoMultiline = prefShindoList.reverse().map((prefShindo, index) => {
        const intensityLabel = ["震度７", "震度６強", "震度６弱", "震度５強", "震度５弱", "震度５弱以上と推定", "震度４", "震度３", "震度２", "震度１", "不明"][index]; // 逆順にするのを考慮

        if (Object.keys(prefShindo).length === 0) return "";
        return `［${intensityLabel}］\n` + Object.entries(prefShindo).map(([prefName, areas]) => {
          return `　${prefName}：${areas.join(" ")}`;
        }).join("\n");
      }).filter(Boolean).join("\n");
    } else {
      detail.maxShindo = 0;
    }

    detail.shindoOneline[0] = this.makeSummaryText(data.Head.EventID, data, ["time", "intensity", "epicenter", "magnitude", "depth", "comment"]);

    return detail;
  }

  /** 遠地地震に関する情報 */
  async vxse5e (url: string): Promise<QuakeDetail> {
    const detail = await this.vxse52(url); // 使うデータはほぼ同じだから妥協（あんまり良くないけど）

    detail.isSokuho = false; // 速報ではない
    detail.depthStr = ""; //　空白にすると、非表示になる
    return detail;
  }

  /** 震源要素更新 */
  async vxse61 (url: string): Promise<QuakeDetail> {
    const detail = await this.vxse52(url, false); // 使うデータはほぼ同じだから妥協（あんまり良くないけど！！！！！！！！）

    detail.isSokuho = false; // 速報ではない
    return detail;
  }

  /** 震源名を「名称（詳細名）（方角表記）」形式で組み立てる */
  makeEpicenterText (hypocenter: QT.Hypocenter | QT.IntlHypocenter | QT.DetailedHypocenter){
    const area = hypocenter.Area as Partial<QT.IntlHypocenterArea & QT.DetailedHypocenterArea> & QT.HypocenterArea;
    return `${area.Name}${area.DetailedName ? `（${area.DetailedName}）` : ""}${area.NameFromMark ? `（${area.NameFromMark}）` : ""}`;
  }

  /**
   * ティッカー先頭に流す日英サマリーテキストを組み立てる。
   * @param eventId Event ID
   * @param data 電文データ
   * @param types 例: ["time", "intensity"] など、更新する summaryText の種類を指定する。指定された種類の情報が data に存在しない場合は、その種類の summaryText は更新されない。
   * @returns 生成されたテキストぜんぶ
   */
  makeSummaryText (eventId: string, data: QT.Report, types: ("time" | "intensity" | "epicenter" | "magnitude" | "depth" | "comment")[]): string {
    const enMonthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const jaIntensity: Record<string, string> = { "1": " 1 ", "2": " 2 ", "3": " 3 ", "4": " 4 ", "5-": " 5 弱", "5+": " 5 強", "6-": " 6 弱", "6+": " 6 強", "7": "7" };
    const enIntensity: Record<string, string> = { "1": "1", "2": "2", "3": "3", "4": "4", "5-": "lower 5", "5+": "upper 5", "6-": "lower 6", "6+": "upper 6", "7": "7" };

    const detail = this.quakeData[eventId].detail as QuakeDetail;
    const earthquake = data.Body.Earthquake as QT.Earthquake | undefined;
    const comments = data.Body.Comments as QT.Comments;
    const isVolcanoEruption = (comments.FreeFormComment || "").includes("大規模な噴火が発生");

    if (isVolcanoEruption){
      detail.summaryText.comment = [
        (comments.FreeFormComment as string).replace(/\n（注.*/g, ""),
        ""
      ];
    } else {
      if (types.includes("time")){
        if (earthquake){
          const originTime = new Date(earthquake.OriginTime);
          const month = originTime.getMonth() + 1;
          const date = originTime.getDate();
          const hours = originTime.getHours();
          const minutes = originTime.getMinutes();

          detail.summaryText.time = [
            `${month} 月 ${date} 日 ${hours} 時 ${minutes} 分頃、`,
            `at around ${(hours + 11) % 12 + 1}:${("0" + minutes).slice(-2)} ${hours >= 12 ? "p.m." : "a.m."} on ${enMonthShort[month - 1]} ${date} (UTC+9).`
          ];
        }
      }
      if (types.includes("intensity")){
        const observation = (data.Body.Intensity as QT.Intensity | undefined)?.Observation;
        if (observation){
          const maxInt = observation.MaxInt;

          const jaText = `最大震度${jaIntensity[maxInt]}を観測する${(maxInt[0] === "6" || maxInt[0] === "7") ? "非常に強い" : (maxInt[0] === "5" ? "強い" : (maxInt[0] === "4" ? "やや強い" : ""))}地震が発生しました。`;
          if (earthquake){
            detail.summaryText.intensity = [
              jaText,
              `registered a maximum seismic intensity of ${enIntensity[maxInt]} in parts of Japan.`
            ];
          } else {
            if (!detail.summaryText.depth[1]) detail.summaryText.depth = [
              "",
              "The quake"
            ]; // あとで VXSE52 が来て変わることを想定　VXSE52 のあとで VXSE51 が来ても大丈夫なように条件を入れる
            detail.summaryText.intensity = [
              jaText,
              `registered a maximum seismic intensity of ${enIntensity[maxInt]} in parts of Japan has just occurred.`
            ];
          }
        }
      }
      if (types.includes("epicenter")){
        if (earthquake?.Hypocenter){
          const hypocenter = earthquake.Hypocenter;
          detail.summaryText.epicenter = [
            `震源は${this.makeEpicenterText(hypocenter)}、`,
            hypocenter.Area.enName
          ];
        }
      }
      if (types.includes("magnitude")){
        if (earthquake?.Magnitude){
          if (earthquake.Magnitude === "Ｍ不明"){
            detail.summaryText.magnitude = [
              "マグニチュードは不明、",
              "An unknown magnitude earthquake struck"
            ];
          } else if (earthquake.Magnitude === "Ｍ８を超える巨大地震"){
            detail.summaryText.magnitude = [
              "マグニチュード 8 を超える巨大地震です。",
              "An enormous earthquake with a magnitude of over 8 struck"
            ];
          } else {
            detail.summaryText.magnitude = [
              `マグニチュードは ${earthquake.Magnitude}、`,
              `A magnitude ${earthquake.Magnitude} earthquake struck`
            ];
          }
        }
      }
      if (types.includes("depth")){
        if (earthquake?.Hypocenter){
          const hypocenter = earthquake.Hypocenter;
          const coordinates = this.parseCoordinate(this.pickCoordinate(hypocenter.Area));
          if (coordinates.length >= 3){
            if (coordinates[2] === 0){
              detail.summaryText.depth = [
                "震源の深さはごく浅いです。",
                "The quake, which occurred at a very shallow depth,"
              ];
            } else if (coordinates[2] === -700000){
              detail.summaryText.depth = [
                "震源の深さは 700 km 以上です。",
                "The quake, which occurred at a depth of over 700 kilometers,"
              ];
            } else {
              detail.summaryText.depth = [
                `震源の深さは ${-coordinates[2] / 1000} km です。`,
                `The quake, which occurred at a depth of ${-coordinates[2] / 1000} kilometers,`
              ];
            }
          } else {
            detail.summaryText.depth = [
              "震源の深さは不明です。",
              ""
            ];
          }
        }
      }
      if (types.includes("comment")){
        if (comments.ForecastComment){
          const commentCodes = comments.ForecastComment.Code.split(" ");
          detail.summaryText.comment = [
            comments.ForecastComment.Text.replaceAll("\n", " "),
            commentCodes.map(code => AdditionalComments[code] ? AdditionalComments[code].en : "").filter(text => text).join(" ")
          ];
        }
        detail.summaryText.freeFormComment = comments.FreeFormComment || "";
      }
    }

    return [
      detail.summaryText.time[0],
      detail.summaryText.intensity[0],
      detail.summaryText.epicenter[0],
      detail.summaryText.magnitude[0],
      detail.summaryText.depth[0],
      detail.summaryText.comment[0]
    ].join("") + "　　　" + [
      detail.summaryText.magnitude[1],
      detail.summaryText.epicenter[1],
      detail.summaryText.time[1],
      detail.summaryText.depth[1],
      detail.summaryText.intensity[1],
      detail.summaryText.comment[1]
    ].join(" ");
  }
}
