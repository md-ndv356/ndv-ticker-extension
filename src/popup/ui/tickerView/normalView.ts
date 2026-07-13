export type NormalTitleDeps = {
  context: CanvasRenderingContext2D;
  colorScheme: any;
  colorThemeMode: number;
  mscale: number;
  fontSans: string;
  /** 表示中の項目のタイトル */
  currentTitle: string;
  /** 次に表示する項目のタイトル */
  nextTitle: string;
  t_viewType: number;
  t_Cancelled: boolean;
};

/** 通常画面のタイトル部（上段）を描画する。津波情報発令中は「津波情報」の表示になる。 */
export function renderNormalTitle(deps: NormalTitleDeps){
  const {
    context,
    colorScheme,
    colorThemeMode,
    mscale,
    fontSans,
    currentTitle,
    nextTitle,
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

  context.fillStyle = colorScheme[colorThemeMode][3][mscale];
  context.font = "45px " + fontSans;
  if (t_viewType === 2 && !t_Cancelled){
    // 津波情報発令中なら津波情報と表示
    context.fillText("津波情報", 450, 47, 250);
  } else {
    // Title を描画
    context.fillText(currentTitle, 10, 47, 600);
    // Next title を描画
    context.font = "24px " + fontSans;
    context.fillStyle = mscale === 1 ? colorScheme[colorThemeMode][4][0] : colorScheme[colorThemeMode][4][1];
    context.fillText(nextTitle, 690, 50, 340);
  }
  context.restore();
}
