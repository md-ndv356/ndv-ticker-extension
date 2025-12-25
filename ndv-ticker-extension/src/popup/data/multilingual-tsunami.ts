export type MultilingualTsunami = string[][];

// Temporary shim until data file is converted to ESM/JSON.
// Reads the global `multilingual_pls` defined by data-multilingual-tsunami.js.
const multilingualTsunamiGlobal = (globalThis as any).multilingual_pls as MultilingualTsunami | undefined;

if (!multilingualTsunamiGlobal) {
  console.warn('multilingual_pls (tsunami) is not loaded; check script order.');
}

export const multilingualTsunami = multilingualTsunamiGlobal ?? [];
