import type { AreaOperator } from "./common.ts";
import { createAreaOperator } from "./common.ts";
import { EarthquakeOperator } from "./earthquake.ts";
import { TsunamiOperator } from "./tsunami.ts";
import { TyphCommentOperator } from "./typhoon.ts";
import { WarnCurrentOperator } from "./warning.ts";

export type DataOperatorType = {
  area: AreaOperator;
  tsunami: TsunamiOperator;
  earthquake: EarthquakeOperator;
  typh_comment: TyphCommentOperator;
  warn_current: WarnCurrentOperator;
};

const area = createAreaOperator();

const DataOperator: DataOperatorType = {
  area,
  tsunami: new TsunamiOperator(),
  earthquake: new EarthquakeOperator(),
  typh_comment: new TyphCommentOperator(),
  warn_current: new WarnCurrentOperator(area)
};

export { DataOperator };