export interface NormalText {
  title: string;
  text: string;
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
        eewBegin: number;
        eewContinue: number;
        eewEnd: number;
        eewHighBeep: number;
        eewHighCustom: number;
        eewPlum: number;
        floodLevel4: number;
        floodLevel5: number;
        doshakeikai: number;
        kirokuame: number;
        nornadoNotice: number;
        level5Warning: number;
        tsunamiWarning: number;
        quake: [number, number, number, number, number, number, number, number, number];
      },
      speech: {
        options: {
          eew: boolean;
          doshakeikai: boolean;
          quake: boolean;
          level5Warning: boolean;
          kirokuame: boolean;
        }
        volume: number;
      }
    }
  }
}

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
      normalTexts: [],
      newsText: {
        title: "",
        subtitle: "",
        text: ""
      },
      scrollSpeed: 4.5,
      tsunamiPosition: "top",
      themeColor: {
        ticker: 0
      },
      sfx: {
        eewBegin: 100,
        eewContinue: 100,
        eewEnd: 100,
        eewHighBeep: 12,
        eewHighCustom: 100,
        eewPlum: 100,
        floodLevel4: 100,
        floodLevel5: 100,
        doshakeikai: 100,
        kirokuame: 100,
        nornadoNotice: 100,
        level5Warning: 100,
        tsunamiWarning: 100,
        quake: [100, 100, 100, 100, 100, 100, 100, 100, 100]
      },
      speech: {
        options: {
          eew: true,
          doshakeikai: true,
          quake: true,
          level5Warning: true,
          kirokuame: true
        },
        volume: 100
      }
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
      config: result.config == null ? defaultAppConfig.config : result.config
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
  appConfigCache = defaultAppConfig;
  await chrome.storage.local.set(defaultAppConfig);
}
