const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

// Daftar filter yang bisa berganti
const filterModes = ['thermal', 'invert', 'hue_rotate', 'cyber_grid'];
let currentFilterIndex = 0;

// Variabel untuk mencegah pergantian filter terlalu cepat (debounce)
let lastPinchTime = 0;

function drawFilterInsideFrame(mode, width, height) {
  if (mode === 'thermal') {
    canvasCtx.globalCompositeOperation = 'difference';
    canvasCtx.fillStyle = '#ff00ff';
    canvasCtx.fillRect(0, 0, width, height);
  } else if (mode === 'invert') {
    canvasCtx.globalCompositeOperation = 'difference';
    canvasCtx.fillStyle = 'white';
    canvasCtx.fillRect(0, 0, width, height);
  } else if (mode === 'hue_rotate') {
    canvasCtx.globalCompositeOperation = 'color';
    canvasCtx.fillStyle = '#00ffff';
    canvasCtx.fillRect(0, 0, width, height);
  } else if (mode === 'cyber_grid') {
    canvasCtx.globalCompositeOperation = 'source-over';
    canvasCtx.fillStyle = 'rgba(0, 255, 200, 0.3)';
    canvasCtx.fillRect(0, 0, width, height);
  }
}

function onResults(results) {
  canvasElement.width = videoElement.videoWidth || 640;
  canvasElement.height = videoElement.videoHeight || 480;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // 1. Gambar Video Asal
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  const currentTime = Date.now();

  // 2. Cek Gestur Ganti Filter (Ibu Jari & Telunjuk Bersentuhan pada Salah Satu Tangan)
  const checkPinch = (handLandmarks) => {
    if (!handLandmarks) return false;
    const thumb = handLandmarks[4];
    const index = handLandmarks[8];
    const dx = (thumb.x - index.x) * canvasElement.width;
    const dy = (thumb.y - index.y) * canvasElement.height;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < 30; // Jarak sangat dekat (bertabrakan)
  };

  const leftPinch = checkPinch(results.leftHandLandmarks);
  const rightPinch = checkPinch(results.rightHandLandmarks);

  // Jika ada tabrakan jari dan sudah lewat 500ms dari tabrakan sebelumnya -> Ganti Mode
  if ((leftPinch || rightPinch) && (currentTime - lastPinchTime > 500)) {
    currentFilterIndex = (currentFilterIndex + 1) % filterModes.length;
    lastPinchTime = currentTime;
  }

  // 3. Jika Kedua Tangan Terdeteksi -> Buat Bingkai Filter Antar 4 Jari
  if (results.leftHandLandmarks && results.rightHandLandmarks) {
    const lIndex = results.leftHandLandmarks[8];
    const lThumb = results.leftHandLandmarks[4];
    const rIndex = results.rightHandLandmarks[8];
    const rThumb = results.rightHandLandmarks[4];

    const pLIndex = { x: lIndex.x * canvasElement.width, y: lIndex.y * canvasElement.height };
    const pLThumb = { x: lThumb.x * canvasElement.width, y: lThumb.y * canvasElement.height };
    const pRIndex = { x: rIndex.x * canvasElement.width, y: rIndex.y * canvasElement.height };
    const pRThumb = { x: rThumb.x * canvasElement.width, y: rThumb.y * canvasElement.height };

    // Clip / Potong area di dalam 4 jari
    canvasCtx.save();
    canvasCtx.beginPath();
    canvasCtx.moveTo(pLIndex.x, pLIndex.y);
    canvasCtx.lineTo(pRIndex.x, pRIndex.y);
    canvasCtx.lineTo(pRThumb.x, pRThumb.y);
    canvasCtx.lineTo(pLThumb.x, pLThumb.y);
    canvasCtx.closePath();
    canvasCtx.clip();

    // Gambar ulang video di area terpotong
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // Terapkan Filter yang Sedang Aktif
    drawFilterInsideFrame(filterModes[currentFilterIndex], canvasElement.width, canvasElement.height);
    canvasCtx.restore();

    // Gambar Garis Bingkai Antar Jari
    canvasCtx.beginPath();
    canvasCtx.moveTo(pLIndex.x, pLIndex.y);
    canvasCtx.lineTo(pRIndex.x, pRIndex.y);
    canvasCtx.lineTo(pRThumb.x, pRThumb.y);
    canvasCtx.lineTo(pLThumb.x, pLThumb.y);
    canvasCtx.closePath();
    canvasCtx.strokeStyle = leftPinch || rightPinch ? '#ff0055' : '#00ffcc';
    canvasCtx.lineWidth = 4;
    canvasCtx.stroke();
  }

  // Tampilkan Nama Filter Aktif di Layar
  canvasCtx.fillStyle = '#ffffff';
  canvasCtx.font = '18px sans-serif';
  canvasCtx.fillText(`Mode Filter: ${filterModes[currentFilterIndex].toUpperCase()}`, 20, 30);

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
