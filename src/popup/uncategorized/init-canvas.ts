const canvas1Element = document.getElementById('sample1');
const canvas2Element = document.getElementById('sample2');

if (!(canvas1Element instanceof HTMLCanvasElement) || !(canvas2Element instanceof HTMLCanvasElement)) {
  throw new Error('Canvas elements are missing');
}

const contextValue = canvas1Element.getContext('2d', { willReadFrequently: true });
const timeValue = canvas2Element.getContext('2d', { willReadFrequently: true });

if (!contextValue || !timeValue) {
  throw new Error('Canvas contexts are missing');
}

export const canvas1 = canvas1Element;
export const context = contextValue;
export const canvas2 = canvas2Element;
export const time = timeValue;

export const canvas3 = document.createElement('canvas');
export const ctx3 = canvas3.getContext('2d', { willReadFrequently: true });
