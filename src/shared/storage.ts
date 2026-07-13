export interface NormalText {
  title: string;
  text: string;
  /** 表示の有効・無効 */
  enabled: boolean;
  /** custom: text をそのまま表示 / shortcut: shortcutId のコマンド出力を表示 */
  type: "custom" | "shortcut";
  /** type が shortcut のときのコマンド ID（例: "weather/temperature/high"） */
  shortcutId: string | null;
}

export interface NewsText {
  title: string;
  subtitle: string;
  text: string;
}

export interface GainProgram {
  effective: boolean;
  gain: number;
  target: "master" | "speech";
  time: {
    h: number;
    m: number;
  }
}

export type tsunamiPositionStyle = "top" | "replace" | "none";

export interface AppConfig {
  info: {
    lastVersion?: string;
  },
  config: {
    app: {
      autoCopy: {
        eew: boolean;
        quake: boolean;
      },
      interval: {
        [key: string]: number;
      }
    }
    ticker: {
      normalTexts: NormalText[];
      newsText: NewsText;
      scrollSpeed: number;
      tsunamiPosition: tsunamiPositionStyle;
      themeColor: {
        ticker: number;
      }

      sfx: {
        /** マスター音量（0-1） */
        master: number;
        eewBegin: number;
        eewContinue: number;
        eewEnd: number;
        eewHighBeep: number;
        eewHighCustom: number;
        eewPlum: number;
        floodLevel4: number;
        floodLevel5: number;
        /** 気象危険警報（レベル４）の音量。旧 doshakeikai（土砂災害警戒情報）の後継 */
        urgentWarning: number;
        kirokuame: number;
        nornadoNotice: number;
        level5Warning: number;
        tsunamiWarning: number;
        quake: [number, number, number, number, number, number, number, number, number];
        /** 震度別の地震情報音の種類 */
        quakeTypes: ("normal" | "major")[];
      },
      speech: {
        /** 読み上げ全体の有効・無効 */
        enabled: boolean;
        options: {
          eew: boolean;
          quake: boolean;
          level5Warning: boolean;
          kirokuame: boolean;
        }
        volume: number;
      },
      /** 気象警報・注意報の表示量制限 */
      weatherWarn: {
        ignore: {
          advisory: boolean;
          warning: boolean;
        }
      },
      /** 記録的短時間大雨情報の読み上げを地点単位に分割するかどうか */
      partiallyReadingAme: boolean;
      soraViewEnabled?: boolean;
      gainPrograms?: GainProgram[];
    }
  }
}

const createEmptyNormalText = (): NormalText => ({
  title: "",
  text: "",
  enabled: true,
  type: "custom",
  shortcutId: null
});

const cloneDefaultConfig = (): AppConfig["config"] => JSON.parse(JSON.stringify(defaultAppConfig.config));
const cloneDefaultAppConfig = (): AppConfig => JSON.parse(JSON.stringify(defaultAppConfig));

const ensureNormalTexts = (texts?: Partial<NormalText>[]): NormalText[] => {
  const normalized = texts ?? [];
  // 旧形式（enabled などがない）の項目も既定値で補って読み込めるようにする
  return normalized.map(item => ({
    ...createEmptyNormalText(),
    ...item
  }));
};

const mergeConfig = (stored?: AppConfig["config"]): AppConfig["config"] => {
  const base = cloneDefaultConfig();
  if (!stored) return base;

  return {
    app: {
      autoCopy: {
        ...base.app.autoCopy,
        ...(stored.app?.autoCopy ?? {})
      },
      interval: {
        ...base.app.interval,
        ...(stored.app?.interval ?? {})
      }
    },
    ticker: {
      ...base.ticker,
      ...stored.ticker,
      normalTexts: ensureNormalTexts(stored.ticker?.normalTexts ?? base.ticker.normalTexts),
      newsText: stored.ticker?.newsText ?? base.ticker.newsText,
      scrollSpeed: stored.ticker?.scrollSpeed ?? base.ticker.scrollSpeed,
      tsunamiPosition: stored.ticker?.tsunamiPosition ?? base.ticker.tsunamiPosition,
      themeColor: {
        ...base.ticker.themeColor,
        ...(stored.ticker?.themeColor ?? {})
      },
      sfx: {
        ...base.ticker.sfx,
        ...(stored.ticker?.sfx ?? {}),
        // 旧設定（土砂災害警戒情報 doshakeikai）の音量を気象危険警報へ引き継ぐ
        urgentWarning: stored.ticker?.sfx?.urgentWarning
          ?? (stored.ticker?.sfx as { doshakeikai?: number } | undefined)?.doshakeikai
          ?? base.ticker.sfx.urgentWarning
      },
      speech: {
        enabled: stored.ticker?.speech?.enabled ?? base.ticker.speech.enabled,
        options: {
          ...base.ticker.speech.options,
          ...(stored.ticker?.speech?.options ?? {})
        },
        volume: stored.ticker?.speech?.volume ?? base.ticker.speech.volume
      },
      weatherWarn: {
        ignore: {
          ...base.ticker.weatherWarn.ignore,
          ...(stored.ticker?.weatherWarn?.ignore ?? {})
        }
      },
      partiallyReadingAme: stored.ticker?.partiallyReadingAme ?? base.ticker.partiallyReadingAme,
      soraViewEnabled: stored.ticker?.soraViewEnabled ?? base.ticker.soraViewEnabled,
      gainPrograms: stored.ticker?.gainPrograms ?? base.ticker.gainPrograms
    }
  };
};

const defaultAppConfig: AppConfig = {
  info: {
    lastVersion: undefined
  },
  config: {
    app: {
      autoCopy: {
        eew: false,
        quake: true
      },
      interval: {
        iedred7584EEW: 3000,
        jmaDevFeed: 8500,
        nhkQuake: 8500,
        tenkiJPtsunami: 25000,
        typhComment: 30000,
        warnInfo: 15000,
        wniMScale: 30000,
        wniRiver: 300000,
        wniSorabtn: 30000
      }
    },
    ticker: {
      normalTexts: [
        {
          title: "お知らせ",
          text: "NDV ティッカーをご利用いただきありがとうございます。",
          enabled: true,
          type: "custom",
          shortcutId: null
        },
        {
          title: "最高気温（℃）",
          text: "",
          enabled: true,
          type: "shortcut",
          shortcutId: "weather/temperature/high"
        }
      ],
      newsText: {
        title: "",
        subtitle: "",
        text: ""
      },
      scrollSpeed: 4,
      tsunamiPosition: "top",
      themeColor: {
        ticker: 0
      },
      sfx: {
        master: 1,
        eewBegin: 100,
        eewContinue: 100,
        eewEnd: 100,
        eewHighBeep: 12,
        eewHighCustom: 100,
        eewPlum: 100,
        floodLevel4: 100,
        floodLevel5: 100,
        urgentWarning: 100,
        kirokuame: 100,
        nornadoNotice: 100,
        level5Warning: 100,
        tsunamiWarning: 100,
        quake: [100, 100, 100, 100, 100, 100, 100, 100, 100],
        quakeTypes: []
      },
      speech: {
        enabled: true,
        options: {
          eew: true,
          quake: true,
          level5Warning: true,
          kirokuame: true
        },
        volume: 1
      },
      weatherWarn: {
        ignore: {
          advisory: false,
          warning: false
        }
      },
      partiallyReadingAme: true,
      soraViewEnabled: false,
      gainPrograms: []
    }
  }
};

let appConfigCache: AppConfig | null = null;

const loadCache = async (): Promise<AppConfig> => {
  if (appConfigCache === null) {
    const result = (await chrome.storage.local.get(["info", "config"])) as {
      info?: Partial<AppConfig["info"]>;
      config?: AppConfig["config"];
    };

    return appConfigCache = {
      info: { ...defaultAppConfig.info, ...(result.info ?? {}) },
      config: mergeConfig(result.config)
    };
  } else {
    return appConfigCache;
  }
}

// Get value from chrome.storage.local with default value
// Key is capable of dot chain (e.g., "config.ticker.scrollSpeed")
export const read = async (): Promise<AppConfig> => {
  if (appConfigCache === null) {
    appConfigCache = await loadCache();
  }

  return appConfigCache;
}

export const save = async (value: AppConfig): Promise<void> => {
  appConfigCache = value;
  await chrome.storage.local.set(value);
}

/**
 * @param key キー（チェーン記法が有効）
 * @param val 設定する値
 */
export const setValue = async (key: string, val: any): Promise<void> => {
  if (appConfigCache === null) {
    appConfigCache = await loadCache();
  }

  const keyParts = key.split(".");
  let obj: Partial<AppConfig> | undefined = appConfigCache;
  for (let i = 0; i < keyParts.length - 1; i++) {
    obj = obj[keyParts.at(i) as keyof typeof obj] as Partial<AppConfig> | undefined;
    if (obj === undefined) throw new Error("Invalid key path: " + key);
  }
  obj[keyParts.at(-1) as keyof Partial<AppConfig>] = val;

  await chrome.storage.local.set(appConfigCache);
}

export const reset = async () => {
  appConfigCache = cloneDefaultAppConfig();
  await chrome.storage.local.set(appConfigCache);
}
