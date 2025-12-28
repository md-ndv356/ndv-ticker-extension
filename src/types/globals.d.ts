// Global declarations for legacy popup scripts loaded via index.html.
// Keep this lightweight; refine types as modules are migrated to TypeScript.

import type { JQueryStatic } from 'jquery';
import type { DataOperatorPublic, TsunamiOperator, TyphCommentOperator, WarnCurrentOperator, TrafficTracker as TrafficTrackerClass } from '../popup/data/jmaDataOperator';

// Quake list samples: db/20240101_quake/quake_list1.json, db/20240101_quake/quake_list2.json,
// db/20240808_quake/quakelist.json, db/jma_quake/list.json
export type QuakeCityIntensity = {
  code: string;
  maxi: string;
};

export type QuakeRegionIntensity = {
  code: string;
  maxi: string;
  city?: QuakeCityIntensity[];
};

export type QuakeListEntry = {
  ctt: string; // Content Time
  eid: string; // Event ID
  rdt: string; // Report Date-Time (ISO8601)
  ttl: string; // Title (ja)
  ift: string; // Info Type (発表/訓練など)
  ser: string; // Serial Number
  at: string;  // Announced Time (ISO8601)
  anm: string; // Area Name (ja)
  acd: string; // Area Code
  cod: string; // Coordinate String "±lat±lon±depth/"
  mag: string; // Magnitude
  maxi: string; // Max Intensity Code
  int?: QuakeRegionIntensity[]; // Per-Region Intensities (optional)
  json: string; // Detail JSON Filename
  en_ttl?: string; // Title (en)
  en_anm?: string; // Area Name (en)
};

export type QuakeList = QuakeListEntry[];

// Tsunami list entries (VTSE41/VTSE51) from db/*_tsunami/list*.json
export type TsunamiKindEntry = {
  code: string | number;
  kind: string;
};

export type TsunamiListEntry = {
  ctt: string; // Content Time
  eid: string; // Event ID
  rdt: string; // Report Date-Time (ISO8601)
  ttl: string; // Title (ja)
  ift: string; // Info Type (発表/訓練など)
  ser: string | number; // Serial (sometimes number 0)
  at: string; // Announce Time (ISO8601)
  anm: string; // Area Name (ja)
  acd: string; // Area Code
  cod: string; // Coordinate String
  mag: string; // Magnitude Text
  kind: TsunamiKindEntry[]; // Advisory/Forecast Codes
  json: string; // Detail JSON Filename
  en_ttl?: string;
  en_anm?: string;
};

// Tsunami detail reports (VTSE41/VTSE51) from db/*_tsunami/*VTSE*.json
export type TsunamiCategoryKind = {
  Name: string;
  Code: string;
  enName?: string;
};

export type TsunamiFirstHeight = {
  ArrivalTime?: string;
  Condition?: string;
  Revise?: string;
};

export type TsunamiMaxHeight = {
  TsunamiHeight?: string;
  DateTime?: string;
};

export type TsunamiLatLon = {
  lat: number;
  lon: number;
};

export type TsunamiStation = {
  Name: string;
  Code: string;
  HighTideDateTime?: string;
  FirstHeight?: TsunamiFirstHeight;
  MaxHeight?: TsunamiMaxHeight;
  latlon?: TsunamiLatLon;
  enName?: string;
};

export type TsunamiArea = {
  Name: string;
  Code: string;
  enName?: string;
};

export type TsunamiForecastItem = {
  Area: TsunamiArea;
  Category?: {
    Kind: TsunamiCategoryKind;
    LastKind?: TsunamiCategoryKind;
  };
  FirstHeight?: TsunamiFirstHeight;
  MaxHeight?: TsunamiMaxHeight;
  Station?: TsunamiStation[];
};

export type TsunamiObservationItem = {
  Area: TsunamiArea;
  Station?: TsunamiStation[];
};

export type TsunamiForecastBlock = {
  CodeDefine?: { Type?: string };
  Item?: TsunamiForecastItem[];
};

export type TsunamiObservationBlock = {
  CodeDefine?: { Type?: string };
  Item?: TsunamiObservationItem[];
};

export type TsunamiHypocenterArea = {
  Name: string;
  Code?: string;
  Coordinate?: string;
  NameFromMark?: string;
  MarkCode?: string;
  Direction?: string;
  Distance?: string;
  enName?: string;
};

export type TsunamiEarthquake = {
  OriginTime?: string;
  ArrivalTime?: string;
  Hypocenter?: { Area: TsunamiHypocenterArea };
  Magnitude?: string;
};

export type TsunamiComments = {
  WarningComment?: { Text: string; Code?: string; enText?: string };
  FreeFormComment?: string;
};

export type TsunamiBody = {
  Tsunami?: {
    Forecast?: TsunamiForecastBlock;
    Observation?: TsunamiObservationBlock;
  };
  Earthquake?: TsunamiEarthquake[];
  Comments?: TsunamiComments;
};

export type TsunamiControl = {
  Title: string;
  DateTime: string;
  Status: string;
  EditorialOffice: string;
  PublishingOffice: string;
};

export type TsunamiHead = {
  Title: string;
  ReportDateTime: string;
  TargetDateTime: string;
  EventID: string;
  InfoType: string;
  Serial: string | null;
  InfoKind: string;
  InfoKindVersion?: string;
  Headline?: { Text?: string; Information?: unknown };
  enTitle?: string;
};

export type TsunamiReport = {
  Control: TsunamiControl;
  Head: TsunamiHead;
  Body: TsunamiBody;
};

export type TsunamiList = TsunamiListEntry[];

// Detail quake reports (VXSE51/52/53/61 etc.) from db/*_quake/*VXSE*.json
export type JmaQuakeLatLon = {
  lat: number;
  lon: number;
};

export type JmaQuakeIntensityStation = {
  Name: string;
  Code: string;
  Int: string;
  latlon?: JmaQuakeLatLon;
  enName?: string;
};

export type JmaQuakeCity = {
  Name: string;
  Code: string;
  MaxInt: string;
  IntensityStation?: JmaQuakeIntensityStation[];
};

export type JmaQuakeArea = {
  Name: string;
  Code: string;
  MaxInt: string;
  City?: JmaQuakeCity[];
  enName?: string;
};

export type JmaQuakePref = {
  Name: string;
  Code: string;
  MaxInt: string;
  Area: JmaQuakeArea[];
  enName?: string;
};

export type JmaQuakeHypocenterArea = {
  Name: string;
  Code?: string;
  Coordinate?: string;
  Coordinate_WGS?: string;
  NameFromMark?: string;
  MarkCode?: string;
  Direction?: string;
  Distance?: string;
  DetailedName?: string;
  DetailedCode?: string;
  enName?: string;
  Source?: string;
};

export type JmaQuakeControl = {
  Title: string;
  DateTime: string;
  Status: string;
  EditorialOffice: string;
  PublishingOffice: string;
};

export type JmaQuakeHeadline = {
  Text?: string;
  Information?: unknown;
};

export type JmaQuakeHead = {
  Title: string;
  ReportDateTime: string;
  TargetDateTime: string;
  EventID: string;
  InfoType: string;
  Serial: string | null;
  InfoKind: string;
  InfoKindVersion?: string;
  Headline?: JmaQuakeHeadline;
  enTitle?: string;
};

export type JmaQuakeEarthquake = {
  OriginTime?: string;
  ArrivalTime?: string;
  Hypocenter?: {
    Area: JmaQuakeHypocenterArea;
  };
  Magnitude?: string;
};

export type JmaQuakeIntensity = {
  Observation?: {
    MaxInt?: string;
    Pref?: JmaQuakePref[];
  };
};

export type JmaQuakeComments = {
  ForecastComment?: {
    Text: string;
    Code?: string;
    enText?: string;
  };
  FreeFormComment?: string;
};

export type JmaQuakeBody = {
  Earthquake?: JmaQuakeEarthquake;
  Intensity?: JmaQuakeIntensity;
  Comments?: JmaQuakeComments;
};

export type JmaQuakeReport = {
  Control: JmaQuakeControl;
  Head: JmaQuakeHead;
  Body: JmaQuakeBody;
};

declare global {
  const $: JQueryStatic;

  // Canvas context defined in init-canvas.js
  const context: CanvasRenderingContext2D;

  // Objects provided by other legacy scripts
  const DataOperator: DataOperatorPublic;
  const tsunami: TsunamiOperator;
  const typh_comment: TyphCommentOperator;
  const warn_current: WarnCurrentOperator;
  const TrafficTracker: typeof TrafficTrackerClass;

  interface CanvasRenderingContext2D {
    // Custom renderer attached elsewhere
    drawTextureImage?: (type: string, x: number, y: number, option?: any) => void;
  }

  interface HTMLImageElement {
    toImageData?: () => ImageData;
    imgBmp?: ImageBitmap;
  }
}

export {};
