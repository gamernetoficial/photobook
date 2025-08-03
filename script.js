const video = document.getElementById('video');
const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');
const qrDiv = document.getElementById('qr');
const frameGallery = document.getElementById('frameGallery');

const framesSrc = Array.from({ length: 20 }, (_, i) => `marco${i + 1}.png`);
const frames = [];
let currentFrameIndex = 0;
let animationId = null;
let capturaRealizada = false;

framesSrc.forEach((src, index) => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  frames.push(img);

  img.onload = () => {
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
  };
});

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      renderPreview();
    };
  })
  .catch(err => {
    console.error('Error al acceder a la cámara:', err);
    alert('No se pudo acceder a la cámara.');
  });

function renderPreview() {
  if (capturaRealizada) return;
  const frame = frames[currentFrameIndex];
  if (frame.complete && frame.width && frame.height) {
    previewCanvas.width = frame.width;
    previewCanvas.height = frame.height;
    previewCtx.drawImage(video, 0, 0, previewCanvas.width, previewCanvas.height);
    previewCtx.drawImage(frame, 0, 0, previewCanvas.width, previewCanvas.height);
  }
  animationId = requestAnimationFrame(renderPreview);
}

document.getElementById('capturar').addEventListener('click', () => {
  capturaRealizada = true;
  if (animationId) cancelAnimationFrame(animationId);
  const frame = frames[currentFrameIndex];
  previewCanvas.width = frame.width;
  previewCanvas.height = frame.height;
  previewCtx.drawImage(video, 0, 0, previewCanvas.width, previewCanvas.height);
  previewCtx.drawImage(frame, 0, 0, previewCanvas.width, previewCanvas.height);
});

document.getElementById('reiniciar').addEventListener('click', () => {
  capturaRealizada = false;
  qrDiv.innerHTML = '';
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  renderPreview();
});

document.getElementById('descargar').addEventListener('click', () => {
  const dataURL = previewCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'foto_con_marco.png';
  link.click();
});

document.getElementById('subir').addEventListener('click', async () => {
  qrDiv.innerHTML = 'Subiendo imagen...';
  previewCanvas.toBlob(async (blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'foto.png');
    try {
      const response = await fetch('https://file.io', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (result.success) {
        const url = result.link;
        qrDiv.innerHTML = `<p>✅ Imagen subida: <a href="${url}" target="_blank">${url}</a></p>`;
        QRCode.toCanvas(document.createElement('canvas'), url, (err, qrCanvas) => {
          if (!err) qrDiv.appendChild(qrCanvas);
        });
      } else {
        qrDiv.innerHTML = '❌ Error al subir la imagen.';
      }
    } catch (err) {
      console.error('Error al subir:', err);