const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

const spiderModes = [
  { name: 'EARTH-1610 (MILES GLITCH)', type: 'miles_glitch' },
  { name: 'EARTH-42 (PROWLER ANOMALY)', type: 'prowler' },
  { name: 'EARTH-2099 (CYBER MESH)', type: 'cyber_mesh' },
  { name: 'SPIDER-SENSE COMIC DOTS', type: 'halftone' }
];

let currentModeIndex = 0;
let lastPinchTime = 0;
let glitchTimer = 0;

function drawSpiderVerseFX(type, w, h) {
  glitchTimer += 0.2;
  const shakeX = (Math.random() - 0.5) * 15;
  const shakeY = (Math.random() - 0.5) * 15;

  if (type === 'miles_glitch') {
    // RGB Split + Glitch Bergetar
    canvasCtx.globalCompositeOperation = 'difference';
    canvasCtx.fillStyle = '#ff0055';
    canvasCtx.fillRect(shakeX, 0, w, h);
    canvasCtx.fillStyle = '#00ffff';
    canvasCtx.fillRect(-shakeX, shakeY, w, h);
  } else if (type === 'prowler') {
    // Warna Ungu Neon Prowler + Invert
    canvasCtx.globalCompositeOperation = 'difference';
    canvasCtx.fillStyle = '#8a2be2';
    canvasCtx.fillRect(0, 0, w, h);
    canvasCtx.globalCompositeOperation = 'screen';
    canvasCtx.fillStyle = '#39ff14';
    canvasCtx.fillRect(shakeX, 0, w, h);
  } else if (type === 'cyber_mesh') {
    // Grid Cyber Jaring 2099
    canvasCtx.strokeStyle = 'rgba(255, 0, 85, 0.8)';
    canvasCtx.lineWidth = 3;
    const step = 25;
    for (let x = 0; x < w; x += step) {
      canvasCtx.beginPath();
      canvasCtx.moveTo(x + Math.sin(glitchTimer) * 5, 0);
      canvasCtx.lineTo(x - Math.sin(glitchTimer) * 5, h);
      canvasCtx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      canvasCtx.beginPath();
      canvasCtx.moveTo(0, y + Math.cos(glitchTimer) * 5);
      canvasCtx.lineTo(w, y - Math.cos(glitchTimer) * 5);
      canvasCtx.stroke();
    }
  } else if (type === 'halftone') {
    // Bintik Komik & Tint Merah
    canvasCtx.fillStyle = 'rgba(255, 0, 85, 0.4)';
    canvasCtx.fillRect(0, 0, w, h);
    canvasCtx.fillStyle = '#000000';
    for (let x = 12; x < w; x += 24) {
      for (let y = 12; y < h; y += 24) {
        canvasCtx.beginPath();
        canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
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

  // 1. Gambar Latar Belakang Webcam Normal
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  const currentTime = Date.now();

  // 2. Deteksi Tabrakan Jari (Pinch) untuk Ganti Filter
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

  // 3. Render Portal Bingkai 4 Jari
  if (results.leftHandLandmarks && results.rightHandLandmarks) {
    const lIndex = results.leftHandLandmarks[8];
    const lThumb = results.leftHandLandmarks[4];
    const rIndex = results.rightHandLandmarks[8];
    const rThumb = results.rightHandLandmarks[4];

    const pLIndex = { x: lIndex.x * canvasElement.width, y: lIndex.y * canvasElement.height };
    const pLThumb = { x: lThumb.x * canvasElement.width, y: lThumb.y * canvasElement.height };
    const pRIndex = { x: rIndex.x * canvasElement.width, y: rIndex.y * canvasElement.height };
    const pRThumb = { x: rThumb.x * canvasElement.width, y: rThumb.y * canvasElement.height };

    // Masking Area Dalam Portal
    canvasCtx.save();
    canvasCtx.beginPath();
    canvasCtx.moveTo(pLIndex.x, pLIndex.y);
    canvasCtx.lineTo(pRIndex.x, pRIndex.y);
    canvasCtx.lineTo(pRThumb.x, pRThumb.y);
    canvasCtx.lineTo(pLThumb.x, pLThumb.y);
    canvasCtx.closePath();
    canvasCtx.clip();

    // Gambar ulang video dengan efek distorsi di dalam portal
    const shakeOffset = Math.sin(Date.now() / 50) * 8;
    canvasCtx.drawImage(results.image, shakeOffset, 0, canvasElement.width, canvasElement.height);

    // Terapkan Efek Spider-Verse
    drawSpiderVerseFX(spiderModes[currentModeIndex].type, canvasElement.width, canvasElement.height);
    canvasCtx.restore();

    // Bingkai Portal Berkilau (Glow Effect)
    canvasCtx.beginPath();
    canvasCtx.moveTo(pLIndex.x, pLIndex.y);
    canvasCtx.lineTo(pRIndex.x, pRIndex.y);
    canvasCtx.lineTo(pRThumb.x, pRThumb.y);
    canvasCtx.lineTo(pLThumb.x, pLThumb.y);
    canvasCtx.closePath();

    canvasCtx.strokeStyle = isPinching ? '#39ff14' : '#ff0055';
    canvasCtx.lineWidth = 6;
    canvasCtx.shadowBlur = 25;
    canvasCtx.shadowColor = '#ff0055';
    canvasCtx.stroke();

    // Titik Laser di Ujung Jari
    [pLIndex, pLThumb, pRIndex, pRThumb].forEach(pt => {
      canvasCtx.beginPath();
      canvasCtx.arc(pt.x, pt.y, 7, 0, 2 * Math.PI);
      canvasCtx.fillStyle = '#00ffff';
      canvasCtx.shadowBlur = 10;
      canvasCtx.shadowColor = '#00ffff';
      canvasCtx.fill();
    });
  }

  // HUD Multiverse Portal
  canvasCtx.shadowBlur = 0;
  canvasCtx.fillStyle = '#ff0055';
  canvasCtx.font = 'bold 20px Courier New';
  canvasCtx.fillText(`[DIMENSION: ${spiderModes[currentModeIndex].name}]`, 20, 35);

  if (isPinching) {
    canvasCtx.fillStyle = '#39ff14';
    canvasCtx.font = 'bold 24px Impact';
    canvasCtx.fillText('ANOMALY DETECTED!', 20, 70);
  }

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
