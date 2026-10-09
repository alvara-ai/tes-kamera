const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

let hue = 0;

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Tampilkan video webcam
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  hue = (hue + 4) % 360;

  // 1. Filter Masker Wajah
  if (results.faceLandmarks) {
    canvasCtx.beginPath();
    for (let i = 0; i < results.faceLandmarks.length; i += 3) {
      const pt = results.faceLandmarks[i];
      const x = pt.x * canvasElement.width;
      const y = pt.y * canvasElement.height;
      if (i === 0) canvasCtx.moveTo(x, y);
      else canvasCtx.lineTo(x, y);
    }
    canvasCtx.closePath();
    canvasCtx.fillStyle = `hsla(${hue}, 100%, 50%, 0.4)`;
    canvasCtx.fill();
    canvasCtx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
    canvasCtx.lineWidth = 2;
    canvasCtx.stroke();
  }

  // 2. Garis Antar Jari Telunjuk (Jari Kiri & Kanan)
  if (results.leftHandLandmarks && results.rightHandLandmarks) {
    const p1 = results.leftHandLandmarks[8];
    const p2 = results.rightHandLandmarks[8];

    const x1 = p1.x * canvasElement.width;
    const y1 = p1.y * canvasElement.height;
    const x2 = p2.x * canvasElement.width;
    const y2 = p2.y * canvasElement.height;

    canvasCtx.beginPath();
    canvasCtx.moveTo(x1, y1);
    canvasCtx.lineTo(x2, y2);
    canvasCtx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
    canvasCtx.lineWidth = 5;
    canvasCtx.stroke();
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
