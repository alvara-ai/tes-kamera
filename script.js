const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

// Mode Efek Multiverse Khas Film Spider-Verse
const spiderModes = [
  { name: 'ANOMALY GLITCH (MILES)', type: 'glitch' },
  { name: 'SPIDER-WEB MESH', type: 'web' },
  { name: 'THERMAL DIMENSION', type: 'thermal' },
  { name: 'HALFTONE COMIC DOTS', type: 'halftone' }
];

let currentModeIndex = 0;
let lastPinchTime = 0;
let glitchOffset = 0;

function drawSpiderEffects(type, w, h) {
  glitchOffset = Math.sin(Date.now() / 100) * 12;

  if (type === 'glitch') {
    // RGB Split / Chromatic Aberration khas Spider-Verse
    canvasCtx.globalCompositeOperation = 'difference';
    canvasCtx.fillStyle = '#ff0055';
    canvasCtx.fillRect(glitchOffset, 0, w, h);
    canvasCtx.fillStyle = '#00ffff';
    canvasCtx.fillRect(-glitchOffset, 0, w, h);
  } else if (type === 'web') {
    // Kisi-kisi Jaring Laba-laba Cyber
    canvasCtx.strokeStyle = 'rgba(0, 255, 200, 0.6)';
    canvasCtx.lineWidth = 2;
    for (let x = 0; x < w; x += 30) {
      canvasCtx.beginPath();
      canvasCtx.moveTo(x, 0);
      canvasCtx.lineTo(x, h);
      canvasCtx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      canvasCtx.beginPath();
      canvasCtx.moveTo(0, y);
      canvasCtx.lineTo(w, y);
      canvasCtx.stroke();
    }
  } else if (type === 'thermal') {
    // Inversi Warna Prowler / Thermal Anomaly
    canvasCtx.globalCompositeOperation = 'difference';
    canvasCtx.fillStyle = '#ffffff';
    canvasCtx.fillRect(0, 0, w, h);
  } else if (type === 'halftone') {
    // Efek Bintik Komik Khas Marvel Comics
    canvasCtx.fillStyle = 'rgba(255, 0, 85, 0.35)';
    canvasCtx.fillRect(0, 0, w, h);
    canvasCtx.fillStyle = '#000000';
    for (let x = 10; x < w; x += 20) {
      for (let y = 10; y < h; y += 20) {
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, 4, 0, 2 * Math.PI);
        canvasCtx.fill();
      }
    }
  }
}

function onResults(results) {
  canvasElement.width = videoElement.videoWidth || 640;
  canvasElement.height = videoElement.videoHeight || 480;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // 1. Tampilkan Gambar Kamera Normal (Latar Belakang)
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  const currentTime = Date.now();

  // 2. Deteksi Gestur Tabrakan Ibu Jari & Telunjuk (Pinch) untuk Ganti Dimensi
  const checkPinch = (handLandmarks) => {
    if (!handLandmarks) return false;
    const thumb = handLandmarks[4];
    const index = handLandmarks[8];
    const dx = (thumb.x - index.x) * canvasElement.width;
    const dy = (thumb.y - index.y) * canvasElement.height;
    return Math.sqrt(dx * dx + dy * dy) < 28;
  };

  const isPinching = checkPinch(results.leftHandLandmarks) || checkPinch(results.rightHandLandmarks);

  if (isPinching && (currentTime - lastPinchTime > 400)) {
    currentModeIndex = (currentModeIndex + 1) % spiderModes.length;
    lastPinchTime = currentTime;
  }

  // 3. Render Portal Bingkai 4 Jari (2 Ibu Jari + 2 Telunjuk)
  if (results.leftHandLandmarks && results.rightHandLandmarks) {
    const lIndex = results.leftHandLandmarks[8];
    const lThumb = results.leftHandLandmarks[4];
    const rIndex = results.rightHandLandmarks[8];
    const rThumb = results.rightHandLandmarks[4];

    const pLIndex = { x: lIndex.x * canvasElement.width, y: lIndex.y * canvasElement.height };
    const pLThumb = { x: lThumb.x * canvasElement.width, y: lThumb.y * canvasElement.height };
    const pRIndex = { x: rIndex.x * canvasElement.width, y: rIndex.y * canvasElement.height };
    const pRThumb = { x: rThumb.x * canvasElement.width, y: rThumb.y * canvasElement.height };

    // Tentukan Batas Potongan Portal
    canvasCtx.save();
    canvasCtx.beginPath();
    canvasCtx.moveTo(pLIndex.x, pLIndex.y);
    canvasCtx.lineTo(pRIndex.x, pRIndex.y);
    canvasCtx.lineTo(pRThumb.x, pRThumb.y);
    canvasCtx.lineTo(pLThumb.x, pLThumb.y);
    canvasCtx.closePath();
    canvasCtx.clip();

    // Gambar ulang video di dalam portal
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // Terapkan Efek Spider-Verse Aktif
    drawSpiderEffects(spiderModes[currentModeIndex].type, canvasElement.width, canvasElement.height);
    canvasCtx.restore();

    // Garis Energi Portal Spider-Verse
    canvasCtx.beginPath();
    canvasCtx.moveTo(pLIndex.x, pLIndex.y);
    canvasCtx.lineTo(pRIndex.x, pRIndex.y);
    canvasCtx.lineTo(pRThumb.x, pRThumb.y);
    canvasCtx.lineTo(pLThumb.x, pLThumb.y);
    canvasCtx.closePath();

    canvasCtx.strokeStyle = isPinching ? '#ff0055' : '#00ffff';
    canvasCtx.lineWidth = 5;
    canvasCtx.shadowBlur = 20;
    canvasCtx.shadowColor = '#ff0055';
    canvasCtx.stroke();

    // Indikator Titik Jari
    [pLIndex, pLThumb, pRIndex, pRThumb].forEach(pt => {
      canvasCtx.beginPath();
      canvasCtx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
      canvasCtx.fillStyle = '#ff0055';
      canvasCtx.fill();
    });
  }

  // Teks Mode Spider-Verse
  canvasCtx.fillStyle = '#00ffff';
  canvasCtx.font = 'bold 18px monospace';
  canvasCtx.fillText(`[SPIDER-VERSE PORTAL: ${spiderModes[currentModeIndex].name}]`, 20, 40);

  canvasCtx.restore();
}

const holistic = new Holistic({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
});

holistic.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

holistic.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await holistic.send({image: videoElement});
  },
  width: 640,
  height: 480
});

camera.start();
