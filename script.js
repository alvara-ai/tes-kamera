const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

let hue = 0; // Untuk efek warna pelangi yang berubah-ubah

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // 1. Gambar Video Webcam
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  // Ubah warna pelangi perlahan di setiap frame
  hue = (hue + 2) % 360;

  // 2. Gambar Filter Wajah (Warna-warni seperti di video)
  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    for (const landmarks of results.multiFaceLandmarks) {
      canvasCtx.beginPath();
      // Hubungkan titik luar wajah
      for (let i = 0; i < landmarks.length; i += 5) {
        const x = landmarks[i].x * canvasElement.width;
        const y = landmarks[i].y * canvasElement.height;
        if (i === 0) canvasCtx.moveTo(x, y);
        else canvasCtx.lineTo(x, y);
      }
      canvasCtx.closePath();
      
      // Beri warna transparan warna-warni pada wajah
      canvasCtx.fillStyle = `hsla(${hue}, 100%, 50%, 0.4)`;
      canvasCtx.fill();
      canvasCtx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
      canvasCtx.lineWidth = 2;
      canvasCtx.stroke();
    }
  }

  // 3. Gambar Garis Antar Jari Tangan (Efek Benang Spiderman)
  if (results.multiHandLandmarks && results.multiHandLandmarks.length >= 2) {
    // Ambil posisi ujung jari telunjuk (Index Fingertip = Landmark 8)
    const hand1 = results.multiHandLandmarks[0][8];
    const hand2 = results.multiHandLandmarks[1][8];

    const x1 = hand1.x * canvasElement.width;
    const y1 = hand1.y * canvasElement.height;
    const x2 = hand2.x * canvasElement.width;
    const y2 = hand2.y * canvasElement.height;

    // Gambar garis laser/benang di antara kedua ujung jari
    canvasCtx.beginPath();
    canvasCtx.moveTo(x1, y1);
    canvasCtx.lineTo(x2, y2);
    canvasCtx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
    canvasCtx.lineWidth = 4;
    canvasCtx.shadowBlur = 10;
    canvasCtx.shadowColor = `hsl(${hue}, 100%, 50%)`;
    canvasCtx.stroke();
  }

  canvasCtx.restore();
}

// Inisialisasi Deteksi Wajah & Tangan (MediaPipe Holistic)
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

// Jalankan Kamera
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await holistic.send({image: videoElement});
  },
  width: 640,
  height: 480
});
camera.start();
