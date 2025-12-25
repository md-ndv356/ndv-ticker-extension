export type MultilingualQuake = string[][];

// Temporary shim until data file is converted to ESM/JSON.
// Reads the global `multilingual` defined by data-multilingual-quake.js.
const multilingualGlobal = (globalThis as any).multilingual as MultilingualQuake | undefined;

if (!multilingualGlobal) {
  console.warn('multilingual (quake) is not loaded; check script order.');
}

export const multilingualQuake = multilingualGlobal ?? [];
