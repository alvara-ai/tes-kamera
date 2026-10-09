const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

// Daftar Universe Spider-Man
const universes = [
  { name: 'Earth-1610 (Miles)', type: 'glitch' },
  { name: 'Earth-42 (Prowler)', type: 'prowler' },
  { name: 'Earth-2099 (Miguel)', type: 'cyber' },
  { name: 'Earth-65 (Gwen)', type: 'gwen' }
];

let currentUniverseIndex = 0;
let lastPinchTime = 0;

function applyUniverseFilter(type, width, height) {
  if (type === 'glitch') {
    // Efek Glitch RGB Split khas Miles Morales
    canvasCtx.globalCompositeOperation = 'difference';
    canvasCtx.fillStyle = '#ff0055';
    canvasCtx.fillRect(0, 0, width, height);
  } else if (type === 'prowler') {
    // Efek Prowler: Ungu & Hijau Neon
    canvasCtx.globalCompositeOperation = 'color-burn';
    canvasCtx.fillStyle = '#8a2be2';
    canvasCtx.fillRect(0, 0, width, height);
  } else if (type === 'cyber') {
    // Efek Cyberpunk Miguel O'Hara 2099
    canvasCtx.globalCompositeOperation = 'difference';
    canvasCtx.fillStyle = '#00ffff';
    canvasCtx.fillRect(0, 0, width, height);
  } else if (type === 'gwen') {
    // Efek Pastel Watercolor Gwen Stacy
    canvasCtx.globalCompositeOperation = 'screen';
    canvasCtx.fillStyle = 'rgba(255, 105, 180, 0.6)';
    canvasCtx.fillRect(0, 0, width, height);
  }
}

function onResults(results) {
  canvasElement.width = videoElement.videoWidth || 640;
  canvasElement.height = videoElement.videoHeight || 480;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // 1. Tampilkan Gambar Utama (Universe Asal)
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  const currentTime = Date.now();

  // 2. Deteksi Gestur Tabrakan Jari (Pinch) untuk Pindah Universe
  const checkPinch = (handLandmarks) => {
    if (!handLandmarks) return false;
    const thumb = handLandmarks[4];
    const index = handLandmarks[8];
    const dx = (thumb.x - index.x) * canvasElement.width;
    const dy = (thumb.y - index.y) * canvasElement.height;
    return Math.sqrt(dx * dx + dy * dy) < 30;
  };

  const isPinching = checkPinch(results.leftHandLandmarks) || checkPinch(results.rightHandLandmarks);

  if (isPinching && (currentTime - lastPinchTime > 500)) {
    currentUniverseIndex = (currentUniverseIndex + 1) % universes.length;
    lastPinchTime = currentTime;
  }

  // 3. Buat Portal Multiverse di Antara 4 Jari
  if (results.leftHandLandmarks && results.rightHandLandmarks) {
    const lIndex = results.leftHandLandmarks[8];
    const lThumb = results.leftHandLandmarks[4];
    const rIndex = results.rightHandLandmarks[8];
    const rThumb = results.rightHandLandmarks[4];

    const pLIndex = { x: lIndex.x * canvasElement.width, y: lIndex.y * canvasElement.height };
    const pLThumb = { x: lThumb.x * canvasElement.width, y: lThumb.y * canvasElement.height };
    const pRIndex = { x: rIndex.x * canvasElement.width, y: rIndex.y * canvasElement.height };
    const pRThumb = { x: rThumb.x * canvasElement.width, y: rThumb.y * canvasElement.height };

    // Potong area di dalam portal jari
    canvasCtx.save();
    canvasCtx.beginPath();
    canvasCtx.moveTo(pLIndex.x, pLIndex.y);
    canvasCtx.lineTo(pRIndex.x, pRIndex.y);
    canvasCtx.lineTo(pRThumb.x, pRThumb.y);
    canvasCtx.lineTo(pLThumb.x, pLThumb.y);
    canvasCtx.closePath();
    canvasCtx.clip();

    // Tampilkan tampilan Universe lain di dalam portal
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    applyUniverseFilter(universes[currentUniverseIndex].type, canvasElement.width, canvasElement.height);
    canvasCtx.restore();

    // Garis Energi Portal Spider-Verse
    canvasCtx.beginPath();
    canvasCtx.moveTo(pLIndex.x, pLIndex.y);
    canvasCtx.lineTo(pRIndex.x, pRIndex.y);
    canvasCtx.lineTo(pRThumb.x, pRThumb.y);
    canvasCtx.lineTo(pLThumb.x, pLThumb.y);
    canvasCtx.closePath();
    canvasCtx.strokeStyle = isPinching ? '#ff0055' : '#00ffff';
    canvasCtx.lineWidth = 4;
    canvasCtx.shadowBlur = 15;
    canvasCtx.shadowColor = '#ff0055';
    canvasCtx.stroke();
  }

  // Tampilkan Nama Universe di Pojok Layar
  canvasCtx.fillStyle = '#00ffff';
  canvasCtx.font = 'bold 20px sans-serif';
  canvasCtx.fillText(`PORTAL: ${universes[currentUniverseIndex].name}`, 20, 40);

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
