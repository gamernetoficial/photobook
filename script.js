const video = document.getElementById('video');
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const qrDiv = document.getElementById('qr');
const frameGallery = document.getElementById('frameGallery');

let currentStream = null;
let currentFrameIndex = 0;
let capturaRealizada = false;

const framesSrc = Array.from({ length: 20 }, (_, i) => `marco${i + 1}.png`);
const frames = framesSrc.map(src => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  return img;
});

// 🎥 Obtener cámara trasera
async function getBackCameraId() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter(d => d.kind === 'videoinput');
  const backCam = videoDevices.find(d => /back|rear/i.test(d.label));
  return backCam ? backCam.deviceId : videoDevices[videoDevices.length - 1]?.deviceId;
}

// 🔧 Iniciar cámara trasera automáticamente
async function startBackCamera() {
  const deviceId = await getBackCameraId();
  if (!deviceId) return alert('No se encontró cámara trasera');

  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId }, width: 640, height: 960 }
    });
    currentStream = stream;
    video.srcObject = stream;
    video.play();
    renderPreview();
  } catch (err) {
    alert('Error al iniciar cámara: ' + err.message);
  }
}

// 🖼️ Renderizar preview
function renderPreview() {
  if (capturaRealizada) return;
  const frame = frames[currentFrameIndex];
  canvas.width = 640;
  canvas.height = 960;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
  requestAnimationFrame(renderPreview);
}

// 📷 Capturar
document.getElementById('capturar').addEventListener('click', () => {
  capturaRealizada = true;
  renderPreview();
});

// ☁️ Subir a imgbb y generar QR
document.getElementById('subir').addEventListener('click', () => {
  qrDiv.innerHTML = 'Subiendo...';
  const base64 = canvas.toDataURL('image/png').replace(/^data:image\/\w+;base64,/, '');
  const formData = new FormData();
  formData.append('image', base64);

  const apiKey = 'TU_API_KEY_AQUÍ'; // ← Reemplaza con tu API key de imgbb

  fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const url = data.data.url;
        qrDiv.innerHTML = `<p><a href="${url}" target="_blank">${url}</a></p>`;
        QRCode.toCanvas(document.createElement('canvas'), url, (err, qrCanvas) => {
          if (!err) qrDiv.appendChild(qrCanvas);
        });
      } else {
        qrDiv.textContent = 'Error al subir.';
        console.error(data);
      }
    })
    .catch(err => {
      qrDiv.textContent = 'Error de conexión.';
      console.error(err);
    });
});

// 🖼️ Galería de marcos
framesSrc.forEach((src, index) => {
  const thumb = document.createElement('img');
  thumb.src = src;
  thumb.className = 'frame-thumbnail';
  thumb.addEventListener('click', () => {
    currentFrameIndex = index;
    document.querySelectorAll('.frame-thumbnail').forEach(el => el.classList.remove('selected-frame'));
    thumb.classList.add('selected-frame');
    if (!capturaRealizada) renderPreview();
  });
  if (index === 0) thumb.classList.add('selected-frame');
  frameGallery.appendChild(thumb);
});

// 🚀 Iniciar cámara trasera al cargar
window.onload = startBackCamera;