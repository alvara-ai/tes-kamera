const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

// Fungsi yang dijalankan setiap kali MediaPipe selesai mendeteksi wajah
function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Gambar video webcam ke canvas
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  // Jika wajah terdeteksi
  if (results.multiFaceLandmarks) {
    for (const landmarks of results.multiFaceLandmarks) {
      // Contoh sederhana: menggambar efek di titik mata/wajah
      canvasCtx.fillStyle = "red";
      for (let point of landmarks) {
        let x = point.x * canvasElement.width;
        let y = point.y * canvasElement.height;
        canvasCtx.fillRect(x, y, 2, 2); // Menggambar titik koordinat
      }
    }
  }
  canvasCtx.restore();
}

// Inisialisasi MediaPipe Face Mesh
const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults);

// Jalankan Kamera Browser
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({image: videoElement});
  },
  width: 640,
  height: 480
});
camera.start();