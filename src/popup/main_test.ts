const newImage = document.createElement("img");
newImage.src = new URL("../public/image/texture/AdobeGothicStd-Bold_46px_000000.png", import.meta.url).href;
(document.getElementById("app") as HTMLElement).appendChild(newImage);

(async () => {
  const audioContext = new AudioContext();
  const audioBuffer = await fetch(new URL("../public/sound/eew-first.mp3", import.meta.url).href).then(res => res.arrayBuffer());
  const decodedData = await audioContext.decodeAudioData(audioBuffer);

  (document.getElementById("play") as HTMLButtonElement).addEventListener("click", () => {
    const source = audioContext.createBufferSource();
    source.buffer = decodedData;
    source.connect(audioContext.destination);
    source.start(0);
  });
})();
