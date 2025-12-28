export type NormalTitleDeps = {
  context: CanvasRenderingContext2D;
  colorScheme: any;
  colorThemeMode: number;
  mscale: number;
  fontSans: string;
  normalItems: Array<{ title?: string }>;
  directTexts: string[];
  viewingTextIndex: number;
  textCount: number;
  t_viewType: number;
  t_Cancelled: boolean;
};

export function renderNormalTitle(deps: NormalTitleDeps){
  const {
    context,
    colorScheme,
    colorThemeMode,
    mscale,
    fontSans,
    normalItems,
    directTexts,
    viewingTextIndex,
    textCount,
    t_viewType,
    t_Cancelled
  } = deps;

  context.fillStyle = colorScheme[colorThemeMode][1][mscale];
  context.fillRect(0, 0, 1080, 60);
  context.save();
  context.beginPath();
  context.rect(0, 0, 1080, 60);
  context.clip();
  context.fillStyle = colorScheme[colorThemeMode][1][mscale];
  context.fillRect(0, 0, 1080, 60);
  if (!(t_viewType === 2 && !t_Cancelled)){
    context.font = "28px " + fontSans;
    const titleAt = (offset: number) => normalItems[(viewingTextIndex + offset) % textCount]?.title ?? directTexts[5 + (viewingTextIndex + offset) % textCount];
    switch (textCount){
      case 5:
        context.fillStyle = mscale===1 ? colorScheme[colorThemeMode][4][0] : colorScheme[colorThemeMode][4][1];
        context.fillText(titleAt(4), 895, 50, 185);
      case 4:
        context.fillStyle = mscale===1 ? colorScheme[colorThemeMode][4][0] : colorScheme[colorThemeMode][4][1];
        context.fillText(titleAt(3), 685, 50, 185);
      case 3:
        context.fillStyle = mscale===1 ? colorScheme[colorThemeMode][4][0] : colorScheme[colorThemeMode][4][1];
        context.fillText(titleAt(2), 475, 50, 185);
      case 2:
        context.fillStyle = mscale===1 ? colorScheme[colorThemeMode][4][0] : colorScheme[colorThemeMode][4][1];
        context.fillText(titleAt(1), 265, 50, 185);
        break;
    }
  }
  context.fillStyle = colorScheme[colorThemeMode][3][mscale];
  context.font = "45px " + fontSans;
  if (t_viewType === 2 && !t_Cancelled){
    context.fillText("津波情報", 450, 47, 250);
  } else {
    const currentTitle = normalItems[viewingTextIndex]?.title ?? directTexts[5 + viewingTextIndex];
    context.fillText(currentTitle, 10, 47, 250);
  }
  context.restore();
}
