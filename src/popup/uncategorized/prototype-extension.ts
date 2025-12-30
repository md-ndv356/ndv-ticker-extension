/*

Prototype Extension v0.1.0 - MIT License
Copyright (c) 2023 look Sky <YouTube: looksky495>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

/**
 * 文字列の行数をカウントします。
 * @this {String} 対象の文字列です。
 * @return {Number} 対象の行数です。
 */
Object.defineProperty(String.prototype, "lineCount", {
  value: function(this: string): number{
    let str = this;
    if(str){
      return str.split("\n").length;
    } else {
      return 0;
    }
  }
});

/**
 * CanvasRenderingContext2Dにおいて、円のパスを作成します。
 * @this {CanvasRenderingContext2D} 対象の2Dレンダリングコンテキストです。
 * @param {Number} 中心のx座標
 * @param {Number} 中心のy座標
 * @param {Number} 円の半径(px)
 * @return {Undefined}
 */
Object.defineProperty(CanvasRenderingContext2D.prototype, "circle", {
  value: function(this: CanvasRenderingContext2D, x: number, y: number, r: number){
    this.arc(x, y, r, 0, 6.283185307179586, false);
  }
});

/**
 * 1pxのドットを描きます。
 * @this {CanvasRenderingContext2D} 対象の2Dレンダリングコンテキストです。
 * @param {Array} [
 *  @type {Array} [
 *   @type {Number} 対象のx座標
 *   @type {Number} 対象のy座標
 *  ]
 * ]
 * @return {Undefined}
 */
Object.defineProperty(CanvasRenderingContext2D.prototype, "markDots", {
  value: function(this: CanvasRenderingContext2D, xys: Array<[number, number]>){
    for(let i=0; xys.length>i; i++){
      let xy = xys[i];
      this.fillRect(xy[0],xy[1],1,1);
    }
  }
});

Object.defineProperty(HTMLCollection.prototype, "forEach", {
  value: function(this: HTMLCollectionOf<Element>, f: (value: Element, index: number, array: Element[]) => void){
    let array = Array.from(this);
    return array.forEach(f);
  }
});
Object.defineProperty(HTMLAllCollection.prototype, "forEach", {
  value: function(this: HTMLAllCollection, f: (value: Element, index: number, array: Element[]) => void){
    let array = Array.from(this);
    return array.forEach(f);
  }
});

Object.defineProperty(Element.prototype, "removeChildren", {
  value: function (this: Element){
    const elm = this;
    while (elm.firstChild) elm.removeChild(elm.firstChild);
  }
});

/**
 * スクリプトを非同期で読み込みます。
 * @param {URL | Text} url URL
 * @returns
 */
Object.defineProperty(HTMLScriptElement.prototype, "loadScriptAsync", {
  value: function (this: HTMLScriptElement, url: string | URL){
    return new Promise((resolve, reject) => {
      const script = this;
      script.onerror = reject;
      script.onload = resolve;
      document.body.appendChild(script);
      script.src = typeof url === "string" ? url : url.toString();
    });
  }
});

type UnitFn = (i: number) => number;
type UnitConversionMap = {
  /*----  長さ  ----*/
  km_m: UnitFn;
  m_cm: UnitFn;
  cm_mm: UnitFn;
  km_cm: UnitFn;
  m_mm: UnitFn;
  km_mm: UnitFn;
  m_km: UnitFn;
  cm_m: UnitFn;
  mm_cm: UnitFn;
  cm_km: UnitFn;
  mm_m: UnitFn;
  mm_km: UnitFn;
  m_mile: UnitFn;
  mile_m: UnitFn;
  m_yard: UnitFn;
  yard_m: UnitFn;
  seamile_m: UnitFn;
  m_seamile: UnitFn;
  inch_cm: UnitFn;
  cm_inch: UnitFn;
  feet_inch: UnitFn;
  inch_feet: UnitFn;
  feet_yard: UnitFn;
  yard_feet: UnitFn;
  feet_cm: UnitFn;
  cm_feet: UnitFn;
  /*----  質量  ----*/
  t_kg: UnitFn;
  kg_g: UnitFn;
  g_mg: UnitFn;
  mg_mcg: UnitFn;
  t_g: UnitFn;
  kg_mg: UnitFn;
  g_mcg: UnitFn;
  t_mg: UnitFn;
  kg_mcg: UnitFn;
  t_mcg: UnitFn;
};

const unitConversions: UnitConversionMap = {
  /*----  長さ  ----*/
  km_m: i => i*1000,
  m_cm: i => i*100,
  cm_mm: i => i*10,
  km_cm: i => i*100000,
  m_mm: i => i*1000,
  km_mm: i => i*1000000,
  m_km: i => i/1000,
  cm_m: i => i/100,
  mm_cm: i => i/10,
  cm_km: i => i/100000,
  mm_m: i => i/1000,
  mm_km: i => i/1000000,
  m_mile: i => i/1609.344,
  mile_m: i => i*1609.344,
  m_yard: i => i*1.0936132983,
  yard_m: i => i/1.0936132983,
  seamile_m: i => i*1852,
  m_seamile: i => i/1852,
  inch_cm: i => i*2.54,
  cm_inch: i => i/2.54,
  feet_inch: i => i*12,
  inch_feet: i => i/12,
  feet_yard: i => i/3,
  yard_feet: i => i*3,
  feet_cm: i => i*30.48,
  cm_feet: i => i/30.48,
  /*----  質量  ----*/
  t_kg: i => i*1e3,
  kg_g: i => i*1e3,
  g_mg: i => i*1e3,
  mg_mcg: i => i*1e3,
  t_g: i => i*1e6,
  kg_mg: i => i*1e6,
  g_mcg: i => i*1e6,
  t_mg: i => i*1e9,
  kg_mcg: i => i*1e9,
  t_mcg: i => i*1e12
};

Math.units = unitConversions;

// https://qiita.com/777_happ/items/b2c3b59d79fa4062e3cb を改変
Object.defineProperty(Date.prototype, "strftime", {
  value: function (this: Date, format: string){
    const input = {
      year: this.getFullYear(),
      month: this.getMonth() + 1,
      date: this.getDate(),
      day: this.getDay(),
      hours: this.getHours(),
      minutes: this.getMinutes(),
      seconds: this.getSeconds(),
      msec: this.getMilliseconds(),
      timezone: this.getTimezoneOffset() / -60
    }

    const locations: Record<string, string[]> = {
      "0": ["Africa/Casablanca", "Atlantic/Reykjavik", "Europe/London", "Etc/GMT"],
      "1": ["Europe/Berlin", "Europe/Paris", "Africa/Lagos", "Europe/Budapest", "Europe/Warsaw", "Africa/Windhoek"],
      "2": ["Europe/Istanbul", "Europe/Kiev", "Africa/Cairo", "Asia/Damascus", "Asia/Amman", "Africa/Johannesburg", "Asia/Jerusalem", "Asia/Beirut"],
      "3": ["Asia/Baghdad", "Europe/Minsk", "Asia/Riyadh", "Africa/Nairobi"],
      "4": ["Europe/Moscow", "Asia/Tbilisi", "Asia/Yerevan", "Asia/Dubai", "Asia/Baku", "Indian/Mauritius"],
      "5": ["Asia/Tashkent", "Asia/Karachi"],
      "6": ["Asia/Almaty", "Asia/Dhaka", "Asia/Yekaterinburg"],
      "7": ["Asia/Bangkok", "Asia/Novosibirsk"],
      "8": ["Asia/Krasnoyarsk", "Asia/Ulaanbaatar", "Asia/Shanghai", "Australia/Perth", "Asia/Singapore", "Asia/Taipei"],
      "9": ["Asia/Irkutsk", "Asia/Seoul", "Asia/Tokyo"],
      "10": ["Australia/Hobart", "Asia/Yakutsk", "Australia/Brisbane", "Pacific/Port_Moresby", "Australia/Sydney"],
      "11": ["Asia/Vladivostok", "Pacific/Guadalcanal"],
      "12": ["Etc/GMT-12", "Pacific/Fiji", "Asia/Magadan", "Pacific/Auckland"],
      "13": ["Pacific/Tongatapu", "Pacific/Apia"],
      "-12": ["Etc/GMT+12"],
      "-11": ["Etc/GMT+11"],
      "-10": ["Pacific/Honolulu"],
      "-9": ["America/Anchorage"],
      "-8": ["America/Santa_Isabel", "America/Los_Angeles"],
      "-7": ["America/Chihuahua", "America/Phoenix", "America/Denver"],
      "-6": ["America/Guatemala", "America/Chicago", "America/Regina", "America/Mexico_City"],
      "-5": ["America/Bogota", "America/Indiana/Indianapolis", "America/New_York"],
      "-4.5": ["America/Caracas"],
      "-4": ["America/Halifax", "America/Asuncion", "America/La_Paz", "America/Cuiaba", "America/Santiago"],
      "-3.5": ["America/St_Johns"],
      "-3": ["America/Sao_Paulo", "America/Godthab", "America/Cayenne", "America/Argentina/Buenos_Aires", "America/Montevideo"],
      "-2": ["Etc/GMT+2"],
      "-1": ["Atlantic/Cape_Verde", "Atlantic/Azores"],
      "3.5": ["Asia/Tehran"],
      "4.5": ["Asia/Kabul"],
      "5.5": ["Asia/Colombo", "Asia/Kolkata"],
      "5.75": ["Asia/Kathmandu"],
      "6.5": ["Asia/Yangon"],
      "9.5": ["Australia/Darwin", "Australia/Adelaide"]
    };
    const output: Record<string, string> = {
      d: ("0" + input.date).slice(-2),
      e: (" " + input.date).slice(-2),
      m: ("0" + input.month).slice(-2),
      y: (input.year + "").slice(-2),
      Y: (input.year + ""),
      H: ("0" + input.hours).slice(-2),
      I: ("0" + (input.hours % 12)).slice(-2),
      p: input.hours < 12 ? "AM" : "PM",
      M: ("0" + input.minutes).slice(-2),
      S: ("0" + input.seconds).slice(-2),
      f: ("00" + input.msec + "000").slice(-6),
      A: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][input.day],
      a: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][input.day],
      B: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][input.month - 1],
      b: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][input.month - 1],
      w: input.day + "",
      j: ("00" + Math.floor((this.getTime() - new Date(input.year, 0, 1).getTime()) / 86400000 + 1)).slice(-3),
      z: (input.timezone < 0 ? "-" : "+") + ("0" + Math.floor(input.timezone * (input.timezone < 0 ? -1 : 1))).slice(-2) + ("0" + (input.timezone % 1 * 60)).slice(-2),
      Z: (locations[input.timezone.toString()] ?? []).join(", "),
      "%": "%",
      c: "",
      x: "",
      X: ""
    };
    output.c = output.a + " " + output.b + " " + output.d + " " + output.H + ":" + output.M + ":" + output.S + " " + output.Y;
    output.x = output.Y + "/" + output.m + "/" + output.d;
    output.X = output.H + ":" + output.M + ":" + output.S;

    return format.replace(/%([a-zA-Z%])/g, (a, b) => (output[b] || a));
  }
});

declare global {
  interface String {
    lineCount(): number;
  }
  interface CanvasRenderingContext2D {
    circle(x: number, y: number, r: number): void;
    markDots(xys: Array<[number, number]>): void;
  }
  interface HTMLCollection {
    forEach(callback: (value: Element, index: number, array: Element[]) => void): void;
  }
  interface HTMLAllCollection {
    forEach(callback: (value: Element, index: number, array: Element[]) => void): void;
  }
  interface Element {
    removeChildren(): void;
  }
  interface HTMLScriptElement {
    loadScriptAsync(url: string | URL): Promise<Event>;
  }
  interface Date {
    strftime(format: string): string;
  }
  interface Math {
    units: UnitConversionMap;
  }
}

export {};


