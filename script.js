const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

let hue = 0;

function onResults(results) {
  canvasElement.width = videoElement.videoWidth || 640;
  canvasElement.height = videoElement.videoHeight || 480;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // 1. Tampilkan Gambar Webcam
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  hue = (hue + 3) % 360;

  // Cek apakah kedua tangan terdeteksi
  if (results.leftHandLandmarks && results.rightHandLandmarks) {
    // Landmark 4 = Ujung Ibu Jari (Thumb), Landmark 8 = Ujung Jari Telunjuk (Index)
    const leftIndex = results.leftHandLandmarks[8];
    const leftThumb = results.leftHandLandmarks[4];
    const rightIndex = results.rightHandLandmarks[8];
    const rightThumb = results.rightHandLandmarks[4];

    // Konversi koordinat ke pixel canvas
    const pLeftIndex = { x: leftIndex.x * canvasElement.width, y: leftIndex.y * canvasElement.height };
    const pLeftThumb = { x: leftThumb.x * canvasElement.width, y: leftThumb.y * canvasElement.height };
    const pRightIndex = { x: rightIndex.x * canvasElement.width, y: rightIndex.y * canvasElement.height };
    const pRightThumb = { x: rightThumb.x * canvasElement.width, y: rightThumb.y * canvasElement.height };

    // 2. Gambar Garis Laser Penghubung Antar Jari
    canvasCtx.beginPath();
    canvasCtx.moveTo(pLeftIndex.x, pLeftIndex.y);
    canvasCtx.lineTo(pRightIndex.x, pRightIndex.y);
    canvasCtx.lineTo(pRightThumb.x, pRightThumb.y);
    canvasCtx.lineTo(pLeftThumb.x, pLeftThumb.y);
    canvasCtx.closePath();

    canvasCtx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
    canvasCtx.lineWidth = 4;
    canvasCtx.stroke();

    // 3. Efek Frame / Filter Warna di Dalam Area 4 Jari
    // Cari batas kotak (bounding box) dari keempat ujung jari
    const minX = Math.min(pLeftIndex.x, pLeftThumb.x, pRightIndex.x, pRightThumb.x);
    const maxX = Math.max(pLeftIndex.x, pLeftThumb.x, pRightIndex.x, pRightThumb.x);
    const minY = Math.min(pLeftIndex.y, pLeftThumb.y, pRightIndex.y, pRightThumb.y);
    const maxY = Math.max(pLeftIndex.y, pLeftThumb.y, pRightIndex.y, pRightThumb.y);

    const frameWidth = maxX - minX;
    const frameHeight = maxY - minY;

    if (frameWidth > 20 && frameHeight > 20) {
      // Isi area dalam jari dengan efek warna transparan (seperti di video)
      canvasCtx.fillStyle = `hsla(${hue}, 100%, 50%, 0.45)`;
      canvasCtx.fillRect(minX, minY, frameWidth, frameHeight);

      // Bingkai luar kotak
      canvasCtx.strokeStyle = '#ffffff';
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeRect(minX, minY, frameWidth, frameHeight);
    }
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
