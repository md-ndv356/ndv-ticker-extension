export type QuakeMutable = {
  summary: boolean;
  earthquake_telop_times: number;
  earthquake_telop_remaining: number;
  language: "Ja" | "En";
};

export const quakeRenderState: QuakeMutable = {
  summary: false,
  earthquake_telop_times: 0,
  earthquake_telop_remaining: 1500,
  language: "Ja"
};

export function resetQuakeTelop(mutable: QuakeMutable, isPreliminary: boolean){
  mutable.earthquake_telop_times = isPreliminary ? -1027 : 0;
  mutable.earthquake_telop_remaining = 1500;
}

export function prepareQuakeState(mutable: QuakeMutable, isPreliminary = false){
  resetQuakeTelop(mutable, isPreliminary);
  mutable.language = "Ja";
}

export type QuakeRenderDeps = {
  context: CanvasRenderingContext2D;
  images: any;
  colorScheme: any;
  colorThemeMode: number;
  mscale: number;
  language: "Ja" | "En";
  q_depth: string;
  epicenter_list: string[][];
  q_epiIdx: number;
  q_epiName: string;
  q_currentShindo: number;
  q_maxShindo: number;
  q_magnitude: string;
  isPreliminary: boolean;
  q_timeAll: string;
  timeCount: number;
  cnv_anim1: any;
  shindoListJP: string[];
  DrawTextureText: (text: string, x: number, y: number, opts: any, maxWidth?: number) => void;
  fontSans: string;
  // drawTextureImage is used via context.fillText/Images already contained in images.
  mutable: QuakeMutable;
};

/** MIG-TEMP: Extracted quake render from main.ts; remove/migrate once view dispatcher is modular. */
export function renderQuakeView(deps: QuakeRenderDeps): { shouldReset: boolean } {
  const {
    context,
    images,
    colorScheme,
    colorThemeMode,
    mscale,
    language,
    q_depth,
    epicenter_list,
    q_epiIdx,
    q_epiName,
    q_currentShindo,
    q_maxShindo,
    q_magnitude,
    isPreliminary,
    q_timeAll,
    timeCount,
    cnv_anim1,
    shindoListJP,
    DrawTextureText,
    fontSans,
    mutable
  } = deps;

  const isMscale2 = mscale === 1 && colorThemeMode != 2;
  const sum = (shindoListJP[q_currentShindo] != "");
  if (sum != mutable.summary){
    if (sum){
      cnv_anim1.start_n = -200;
      cnv_anim1.end_n = 0;
      cnv_anim1.start();
    } else {
      cnv_anim1.start_n = 0;
      cnv_anim1.end_n = -200;
      cnv_anim1.start();
    }
  }
  mutable.summary = sum;
  const dif = cnv_anim1.current();
  context.drawImage(images.quake.title[colorThemeMode][mscale].imgBmp, 0, 0);
  context.fillStyle = colorScheme[colorThemeMode][0][mscale];
  context.fillRect(dif, 60, 200, 68);
  if (q_maxShindo > 0) context.drawImage(images.quake.texts.maxInt[colorThemeMode == 2 ? 2 : mscale][language.toLocaleLowerCase()][q_maxShindo<5?q_maxShindo-1:q_maxShindo-2], 240, 0);
  if (q_depth){
    if (language === "Ja") context.drawImage(isMscale2 ? images.quake.texts.depth.ja2 : images.quake.texts.depth.ja, 917, 0);
    if (language === "En") context.drawImage(isMscale2 ? images.quake.texts.depth.en2 : images.quake.texts.depth.en, 917, 3);
  }
  if (q_depth!="ごく浅い" && q_depth!="ごく浅く" && q_depth) context.drawImage(isMscale2 ? images.quake.texts.depth_km2 : images.quake.texts.depth_km, 1042, 28);
  context.drawImage(isMscale2 ? images.quake.texts.magni2 : images.quake.texts.magni, 420, 25);
  context.font = "500 50px " + fontSans;
  context.fillStyle = isMscale2 ? "#333" : "#fff";
  DrawTextureText(q_magnitude, 462, 45, {base:"HelveticaNeue-CondensedBold",px:50,weight:"bold",letterSpacing:0});
  if (q_depth == "ごく浅い"){
    context.font = "500 30px Inter, " + fontSans;
    if (language === "Ja") context.fillText("ごく浅い", 950, 53, 90);
    if (language === "En") context.fillText("shallow", 975, 53, 90)
  } else {
    DrawTextureText(q_depth, 978, 48, {base:"HelveticaNeue-CondensedBold",px:50,weight:"bold",letterSpacing:0}, 60);
  }
  context.font = "500 30px " + fontSans;
  if (language === "Ja") context.fillText(q_epiIdx === -2 ? q_epiName : epicenter_list[0][q_epiIdx], 586, 53, 300);
  if (language === "En") context.fillText(q_epiIdx === -2 ? q_epiName : epicenter_list[1][q_epiIdx], 566, 53, 350);
  context.drawImage(images.quake.texts.intensity[context.fillStyle][q_currentShindo], 10+dif, 60);
  context.font = "23px '7barSP'";
  context.fillText(q_timeAll, 595, 23);
  context.fillStyle = (((timeCount%12)<5) && timeCount<216 && (timeCount%72)<60) ? "#e02222" : isPreliminary ? "#f2f241" : "#2229";
  context.fillRect(224, 1, 10, 58);
  context.fillStyle = colorScheme[colorThemeMode][0][mscale]+"99";
  context.beginPath();
  context.moveTo(200+dif, 127);
  context.lineTo(230+dif,  94);
  context.lineTo(200+dif,  60);
  context.closePath();
  context.fill();
  context.strokeStyle = "#ffffff";
  context.beginPath();
  context.moveTo(200+dif, 123);
  context.lineTo(226+dif,  94);
  context.lineTo(200+dif,  64);
  context.stroke();
  context.beginPath();
  context.moveTo(200+dif,  64);
  context.lineTo(  4+dif,  64);
  context.stroke();
  context.beginPath();
  context.moveTo(200+dif, 123);
  context.lineTo(  4+dif, 123);
  context.stroke();
  if (timeCount < 13){
    context.fillStyle = "#fff5";
    context.beginPath();
    context.moveTo((-(timeCount)*95)+1240, 0);
    context.lineTo((-(timeCount)*95)+1270, 0);
    context.lineTo((-(timeCount)*95)+1210, 127);
    context.lineTo((-(timeCount)*95)+1180, 127);
    context.fill();
  }
  let shouldReset = false;
  if(mutable.earthquake_telop_times > 1){
    mutable.earthquake_telop_remaining--;
    if(mutable.earthquake_telop_remaining === 0){
      shouldReset = true;
      mutable.earthquake_telop_remaining = 1500;
      mutable.earthquake_telop_times = 0;
    }
    context.shadowColor = colorScheme[colorThemeMode][5][4];
    context.shadowBlur = 5;
    context.fillStyle = colorScheme[colorThemeMode][5][4];
    context.beginPath();
    context.moveTo(1080, 127);
    context.lineTo(1080, 94);
    context.lineTo(806, 94);
    context.lineTo(773, 127);
    context.fill();
    context.shadowBlur = 0;
    context.fillStyle = "#fff";
    context.font = "30px " + fontSans;
    context.fillText(Math.ceil(mutable.earthquake_telop_remaining/50)+"秒後に通常画面に復帰します", 812, 124, 265);
  }
  return { shouldReset };
}
