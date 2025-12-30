export type EewTextureDrawer = {
  EEW_intensity: (x: number, y: number, index: any) => void;
  EEW_epicenter: (type: string, x: number, y: number, option?: any) => void;
};

export type EewRenderDeps = {
  context: CanvasRenderingContext2D;
  images: any;
  colorScheme: any;
  colorThemeMode: number;
  fontSans: string;
  drawTextureImage: EewTextureDrawer;
  DrawTextureText: (text: string, x: number, y: number, opts: any, maxWidth?: number) => void;
  eewMapBmp: ImageBitmap | null;
  eewIsAlert: boolean;
  eewIsAssumption: boolean;
  eewClassCode: number | null;
  eewCalcIntensityIndex: any;
  eewEpicenterID: string;
  eewDepth: string;
  eewMagnitude: any;
  eewWarnForecast: string;
  eewWarnTextList: { ja: string[]; en: string[] }[];
  qStartTime: number;
  eewOriginTime: Date;
  testNow: boolean;
  eewEpiPos: number[];
  isCancel: boolean;
};

export function renderEewView(deps: EewRenderDeps): { shouldExit: boolean } {
  const {
    context,
    images,
    colorScheme: _1,
    colorThemeMode: _2,
    fontSans,
    drawTextureImage,
    DrawTextureText,
    eewMapBmp,
    eewIsAlert,
    eewIsAssumption,
    eewClassCode,
    eewCalcIntensityIndex,
    eewEpicenterID,
    eewDepth,
    eewMagnitude,
    eewWarnForecast,
    eewWarnTextList,
    qStartTime,
    eewOriginTime,
    testNow,
    eewEpiPos,
    isCancel
  } = deps;

  if (eewMapBmp) context.drawImage(eewMapBmp, 905, 0);
  context.fillStyle = eewIsAlert ? "#b8240d" : "#2b4aad";
  context.fillRect(0, 60, 900, 68);
  context.fillStyle = eewIsAlert ? "#c42810" : "#233d91";
  context.fillRect(0, 0, 900, 60);
  context.drawImage(images.eew[eewIsAlert ? "pub" : "fc"].imgBmp, 0, 0, 320, 60);
  context.fillStyle = eewIsAlert ? "#f22" : "#000";
  context.fillRect(320, 4, 10, 54);
  context.fillStyle = "#fff";
  if (eewIsAssumption){
    context.font = "500 28px " + fontSans;
    context.fillText("震度", 80, 115, 45);
    context.fillText("地域", 318, 115, 45);
    drawTextureImage.EEW_intensity(135, 60, eewCalcIntensityIndex);
    drawTextureImage.EEW_epicenter("JP_350", 380, 60, {id: eewEpicenterID});
  } else if (eewClassCode != 35){
    context.font = "500 25px " + fontSans;
    context.fillText("最大", 8, 92, 45);
    context.fillText("震度", 8, 121, 45);
    context.fillText("震", 318, 90, 23);
    context.fillText("源", 318, 119, 23);
    drawTextureImage.EEW_intensity(50, 60, eewCalcIntensityIndex);
    drawTextureImage.EEW_epicenter("JP_350", 348, 60, {id: eewEpicenterID});
    context.fillText("深さ", 725, 88, 45);
    context.font = "500 36px " + fontSans;
    context.fillText("M", 170, 118, 35);
    DrawTextureText(eewDepth + "km", 750, 123, {base: "Microsoft-Sans-Serif", px: 40, weight: "bold", color: "ffffff", letterSpacing: 1}, 100);
  } else {
    context.font = "500 55px " + fontSans;
    context.fillText("5弱", 95, 115, 85);
    context.font = "500 30px " + fontSans;
    context.fillText("程度", 185, 115, 60);
    context.font = "500 35px " + fontSans;
    context.fillText("以上", 245, 115, 70);
    drawTextureImage.EEW_epicenter("JP_350", 424, 60, {id: eewEpicenterID});
  }
  if((!eewIsAssumption) && eewClassCode != 35){
    context.font = "500 58px " + fontSans;
    context.fillText((eewMagnitude-0).toFixed(1), 205, 115, 80);
  }
  context.fillStyle = "#777";
  context.fillRect(900, 0, 5, 128);

  if (eewWarnForecast){
    context.font = "500 25px " + fontSans;
    context.fillStyle = "yellow";
    context.fillText("以下の地域では強い揺れに警戒。", 337, 26, 553);
    context.fillStyle = "#fff";
    context.fillText(eewWarnForecast, 337, 53, 553);
  } else if (eewWarnTextList.length){
    context.fillStyle = "#ffea00";
    context.font = "500 25px " + fontSans;
    const topWarnText = eewWarnTextList[Math.floor((qStartTime / 300) % eewWarnTextList.length)];
    context.fillText(topWarnText.ja[Math.floor(((qStartTime % 300) / 300) * topWarnText.ja.length)], 337, 26, 553);
    context.fillText(topWarnText.en[Math.floor(((qStartTime % 300) / 300) * topWarnText.en.length)], 337, 53, 553);
  }

  let shouldExit = false;
  if (eewOriginTime.getTime() < Date.now() - 480000){
    if(!testNow) shouldExit = true;
  }

  if ((!eewIsAssumption) && eewClassCode != 35){
    context.fillStyle = "#d00";
    context.strokeStyle = "#fff";
    context.lineWidth = 2;
    context.globalAlpha = 1 - (qStartTime % 60) / 78;
    context.beginPath();
    context.moveTo(eewEpiPos[0]- 6, eewEpiPos[1]-10);
    context.lineTo(eewEpiPos[0]-10, eewEpiPos[1]- 6);
    context.lineTo(eewEpiPos[0]- 4, eewEpiPos[1]   );
    context.lineTo(eewEpiPos[0]-10, eewEpiPos[1]+ 6);
    context.lineTo(eewEpiPos[0]- 6, eewEpiPos[1]+10);
    context.lineTo(eewEpiPos[0]   , eewEpiPos[1]+ 4);
    context.lineTo(eewEpiPos[0]+ 6, eewEpiPos[1]+10);
    context.lineTo(eewEpiPos[0]+10, eewEpiPos[1]+ 6);
    context.lineTo(eewEpiPos[0]+ 4, eewEpiPos[1]   );
    context.lineTo(eewEpiPos[0]+10, eewEpiPos[1]- 6);
    context.lineTo(eewEpiPos[0]+ 6, eewEpiPos[1]-10);
    context.lineTo(eewEpiPos[0]   , eewEpiPos[1]- 4);
    context.closePath();
    context.fill();
    context.stroke();
    context.lineWidth = 1;
    context.globalAlpha = 1;
  } else {
    context.fillStyle = "#d00";
    const t1 = (qStartTime % 60) / 68;
    const t2 = ((qStartTime + 15) % 60) / 68;
    const t3 = ((qStartTime + 30) % 60) / 68;
    const t4 = ((qStartTime + 45) % 60) / 68;
    context.globalAlpha = 0.5 - t1/2;
    context.beginPath();
    context.arc(eewEpiPos[0], eewEpiPos[1], t1*28.284271, 0, 2*Math.PI);
    context.fill();
    context.globalAlpha = 0.5 - t2/2;
    context.beginPath();
    context.arc(eewEpiPos[0], eewEpiPos[1], t2*28.284271, 0, 2*Math.PI);
    context.fill();
    context.globalAlpha = 0.5 - t3/2;
    context.beginPath();
    context.arc(eewEpiPos[0], eewEpiPos[1], t3*28.284271, 0, 2*Math.PI);
    context.fill();
    context.globalAlpha = 0.5 - t4/2;
    context.beginPath();
    context.arc(eewEpiPos[0], eewEpiPos[1], t4*28.284271, 0, 2*Math.PI);
    context.fill();
    context.globalAlpha = 1;
  }

  if(isCancel) context.drawImage(images.eew.cancel.imgBmp, 0, 0);

  return { shouldExit };
}
