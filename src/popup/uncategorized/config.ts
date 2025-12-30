type ColorLeaf = string | CanvasGradient | null;
type ColorNode = ColorLeaf | ColorLeaf[];
type ColorScheme = ColorNode[][][];

export const RequestURL = {
  iedred7584_eew: "https://api.iedred7584.com/eew/json/",
  yahoo_kmoni_eew: "https://weather-kyoshin.west.edge.storage-yahoo.jp/RealTimeData/{yyyyMMdd}/{yyyyMMddHHmmss}.json",
  lmoni_eew: "https://www.lmoni.bosai.go.jp/monitor/webservice/hypo/eew/{yyyyMMddHHmmss}.json",
  nhkQuake1: "https://www.nhk.or.jp/weather-data/v1/wx/quake/info/?akey=18cce8ec1fb2982a4e11dd6b1b3efa36",
  nhkQuake2: "https://www.nhk.or.jp/weather-data/v1/wx/quake/detail/{event_id}.json",
  jmaDevFeedExtra: "https://www.data.jma.go.jp/developer/xml/feed/extra.xml",
  wni_mscale: "https://weathernews.jp/mscale/json/scale.json",
  wni_sorabtn: "https://weathernews.jp/v/sorawolive/data/json/solive_sorabtn.json",
  wni_river: "https://weathernews.jp/river/csv_v2/latest.csv",
  jmaTableCsvPre1h00_rct: "https://www.data.jma.go.jp/obd/stats/data/mdrr/pre_rct/alltable/pre1h00_rct.csv",
  jmaTableCsvPre24h00_rct: "https://www.data.jma.go.jp/obd/stats/data/mdrr/pre_rct/alltable/pre24h00_rct.csv",
  jmaTableCsvMxwsp00_rct: "https://www.data.jma.go.jp/obd/stats/data/mdrr/wind_rct/alltable/mxwsp00_rct.csv",
  jmaTableCsvMxtemsadext00_rct: "https://www.data.jma.go.jp/obd/stats/data/mdrr/tem_rct/alltable/mxtemsadext00_rct.csv",
  jmaTableCsvMntemsadext00_rct: "https://www.data.jma.go.jp/obd/stats/data/mdrr/tem_rct/alltable/mntemsadext00_rct.csv",
  jmaAmedasLatest: "https://www.jma.go.jp/bosai/amedas/data/latest_time.txt",
  wniliveTimeTable: "https://smtgvs.weathernews.jp/a/solive_timetable/timetable.json"
};

export const FontFamilies = {
  sans: '"Inter", "ヒラギノ角ゴシック", BlinkMacSystemFont, "Noto Sans JP", "游ゴシック", "YuGothic", "Noto Sans CJK", "Meiryo", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
  serif: '"Source Serif", "ヒラギノ明朝", "MS P明朝", serif'
};

document.documentElement.style.setProperty("--font-sans", FontFamilies.sans);
document.documentElement.style.setProperty("--font-serif", FontFamilies.serif);

const workingContext = document.createElement('canvas').getContext('2d');

export const colorScheme: ColorScheme = [
  [
    ["#2e75e8", "#d1d900", "#ff3d3d"],
    [null, null, null],
    ["#71f043", "#c852ff", "#ffffff"],
    ["#fcfefa", "#7e3287", "#f0ff4a"],
    ["#777", "#ddd4bf"],
    ["#fff", "#333", "#d6231d", ["#fff", "#333", "#fff"], "#1144ed"],
    ["#370921", "#ddd", "#ffa13d", "#393939"]
  ],
  [
    ["#302ad1", "#d1c12c", "#a81b1b"],
    [null, null, null],
    ["#71f043", "#c852ff", "#fff"],
    ["#fff", "#fff", "#fff"],
    ["#666", "#bbb"],
    ["#333", "#fff", "#e6e85d", ["#fff", "#333", "#fff"], "#1144ed"],
    ["#370921", "#ddd", "#ffa13d", "#393939"]
  ],
  [
    ["#555555", "#555555", "#555555"],
    ["#444", null, null],
    [null, null, null],
    ["#fff", "#fff", "#fff"],
    ["#ddd", "#ddd"],
    ["#333", "#fff", "#ffb", ["#fff", "#fff", "#fff"], "#555"],
    ["#333", "#ddd", "#fff", "#333"]
  ]
];

if (workingContext) {
  let gradient = workingContext.createLinearGradient(0, 0, 1080, 0);
  gradient.addColorStop(0, "#105396");
  gradient.addColorStop(1, "#428edd");
  colorScheme[0][1][0] = gradient;

  gradient = workingContext.createLinearGradient(0, 0, 1080, 0);
  gradient.addColorStop(0, "#ffef35");
  gradient.addColorStop(1, "#fedb85");
  colorScheme[0][1][1] = gradient;

  gradient = workingContext.createLinearGradient(0, 0, 1080, 0);
  gradient.addColorStop(0, "#df261d");
  gradient.addColorStop(1, "#b21418");
  colorScheme[0][1][2] = gradient;

  gradient = workingContext.createLinearGradient(0, 0, 0, 60);
  gradient.addColorStop(0, "#3a37bd");
  gradient.addColorStop(1, "#151299");
  colorScheme[1][1][0] = gradient;

  gradient = workingContext.createLinearGradient(0, 0, 0, 60);
  gradient.addColorStop(0, "#b3a425");
  gradient.addColorStop(1, "#c7b830");
  colorScheme[1][1][1] = gradient;

  gradient = workingContext.createLinearGradient(0, 0, 0, 60);
  gradient.addColorStop(0, "#d91c18");
  gradient.addColorStop(1, "#b01815");
  colorScheme[1][1][2] = gradient;

  gradient = workingContext.createLinearGradient(0, 20, 0, 60);
  gradient.addColorStop(0.75, "#444");
  gradient.addColorStop(1.00, "#882");
  colorScheme[2][1][1] = gradient;

  gradient = workingContext.createLinearGradient(0, 20, 0, 60);
  gradient.addColorStop(0.00, "#444");
  gradient.addColorStop(0.75, "#723");
  gradient.addColorStop(1.00, "#a12");
  colorScheme[2][1][2] = gradient;
}

export let colorThemeMode = 0;
export const setColorThemeMode = (mode: number) => { colorThemeMode = mode; };
