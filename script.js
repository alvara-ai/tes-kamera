const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

function onResults(results) {
  canvasElement.width = videoElement.videoWidth || 640;
  canvasElement.height = videoElement.videoHeight || 480;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // 1. Lukis Paparan Webcam Asal (Latar Belakang)
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  // 2. Semak Jika Kedua-dua Tangan Dikesan
  if (results.leftHandLandmarks && results.rightHandLandmarks) {
    // Landmark 8 = Hujung Jari Telunjuk, Landmark 4 = Hujung Ibu Jari
    const lIndex = results.leftHandLandmarks[8];
    const lThumb = results.leftHandLandmarks[4];
    const rIndex = results.rightHandLandmarks[8];
    const rThumb = results.rightHandLandmarks[4];

    const pLIndex = { x: lIndex.x * canvasElement.width, y: lIndex.y * canvasElement.height };
    const pLThumb = { x: lThumb.x * canvasElement.width, y: lThumb.y * canvasElement.height };
    const pRIndex = { x: rIndex.x * canvasElement.width, y: rIndex.y * canvasElement.height };
    const pRThumb = { x: rThumb.x * canvasElement.width, y: rThumb.y * canvasElement.height };

    // --- A. CIPTA KAWASAN BINGKAI ANTARA JARI (MASKING) ---
    canvasCtx.save();
    canvasCtx.beginPath();
    canvasCtx.moveTo(pLIndex.x, pLIndex.y);
    canvasCtx.lineTo(pRIndex.x, pRIndex.y);
    canvasCtx.lineTo(pRThumb.x, pRThumb.y);
    canvasCtx.lineTo(pLThumb.x, pLThumb.y);
    canvasCtx.closePath();

    // Potong kawasan kanvas mengikut bentuk 4 jari sahaja
    canvasCtx.clip();

    // --- B. KESAN VISUAL DI DALAM BINGKAI (EFEK INVERT / THERMAL) ---
    // Lukis semula video di kawasan potong
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    
    // Gunakan mod warna Invert / Thermal pada kawasan dalam tangan
    canvasCtx.globalCompositeOperation = 'difference';
    canvasCtx.fillStyle = 'white';
    canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
    
    canvasCtx.restore();

    // --- C. LUKIS GARISAN SEMPADAN DAN BULATAN DI HUJUNG JARI ---
    canvasCtx.beginPath();
    canvasCtx.moveTo(pLIndex.x, pLIndex.y);
    canvasCtx.lineTo(pRIndex.x, pRIndex.y);
    canvasCtx.lineTo(pRThumb.x, pRThumb.y);
    canvasCtx.lineTo(pLThumb.x, pLThumb.y);
    canvasCtx.closePath();

    canvasCtx.strokeStyle = '#00ffcc';
    canvasCtx.lineWidth = 3;
    canvasCtx.stroke();

    // Lukis titik merah di hujung jari telunjuk & ibu jari
    [pLIndex, pLThumb, pRIndex, pRThumb].forEach(pt => {
      canvasCtx.beginPath();
      canvasCtx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
      canvasCtx.fillStyle = '#ff0055';
      canvasCtx.fill();
    });
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
