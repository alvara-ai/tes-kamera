const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

function drawLine(p1, p2, color, width) {
  canvasCtx.beginPath();
  canvasCtx.moveTo(p1.x * canvasElement.width, p1.y * canvasElement.height);
  canvasCtx.lineTo(p2.x * canvasElement.width, p2.y * canvasElement.height);
  canvasCtx.strokeStyle = color;
  canvasCtx.lineWidth = width;
  canvasCtx.stroke();
}

function onResults(results) {
  canvasElement.width = videoElement.videoWidth || 640;
  canvasElement.height = videoElement.videoHeight || 480;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // 1. Tampilkan Gambar Webcam
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  let isHandGestureActive = false;

  // 2. Deteksi Jari Tangan (Jarak Telunjuk)
  if (results.leftHandLandmarks && results.rightHandLandmarks) {
    const leftIndex = results.leftHandLandmarks[8];
    const rightIndex = results.rightHandLandmarks[8];

    // Hitung jarak antara kedua telunjuk
    const dx = (leftIndex.x - rightIndex.x) * canvasElement.width;
    const dy = (leftIndex.y - rightIndex.y) * canvasElement.height;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Jika telunjuk cukup dekat atau direntangkan, gambar garis penghubung
    if (distance < 300) {
      isHandGestureActive = true;
      drawLine(leftIndex, rightIndex, '#00ffcc', 6);
      
      // Lingkaran di ujung jari
      canvasCtx.fillStyle = '#ff0055';
      canvasCtx.beginPath();
      canvasCtx.arc(leftIndex.x * canvasElement.width, leftIndex.y * canvasElement.height, 8, 0, 2 * Math.PI);
      canvasCtx.arc(rightIndex.x * canvasElement.width, rightIndex.y * canvasElement.height, 8, 0, 2 * Math.PI);
      canvasCtx.fill();
    }
  }

  // 3. Efek Wajah (Spider-man / Cyber Mesh / Thermal)
  if (results.faceLandmarks) {
    const landmarks = results.faceLandmarks;

    if (isHandGestureActive) {
      // Efek Thermal / Full Mask saat gestur aktif
      canvasCtx.beginPath();
      for (let i = 0; i < landmarks.length; i += 2) {
        const pt = landmarks[i];
        const x = pt.x * canvasElement.width;
        const y = pt.y * canvasElement.height;
        if (i === 0) canvasCtx.moveTo(x, y);
        else canvasCtx.lineTo(x, y);
      }
      canvasCtx.closePath();
      canvasCtx.fillStyle = 'rgba(255, 0, 85, 0.45)';
      canvasCtx.fill();
      canvasCtx.strokeStyle = '#00ffff';
      canvasCtx.lineWidth = 1.5;
      canvasCtx.stroke();
    } else {
      // Efek Grid Wajah Bawaan (Spider Web Mesh)
      canvasCtx.fillStyle = '#00ffaa';
      for (let i = 0; i < landmarks.length; i += 4) {
        const x = landmarks[i].x * canvasElement.width;
        const y = landmarks[i].y * canvasElement.height;
        canvasCtx.fillRect(x, y, 2, 2);
      }
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
