const video = document.getElementById('video');
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const qrDiv = document.getElementById('qr');
const frameGallery = document.getElementById('frameGallery');

const framesSrc = ['frames/marco1.png', 'frames/marco2.png', 'frames/marco3.png'];
const frames = [];
let currentFrameIndex = 0;
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
    alert('🚫 No se pudo acceder a la cámara.');
    console.error(err);
  });

function renderPreview() {
  if (capturaRealizada) return;
  const frame = frames[currentFrameIndex];
  if (frame.complete) {
    canvas.width = frame.width;
    canvas.height = frame.height;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(renderPreview);
}

document.getElementById('capturar').addEventListener('click', () => {
  capturaRealizada = true;
  const frame = frames[currentFrameIndex];
  canvas.width = frame.width;
  canvas.height = frame.height;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
});

document.getElementById('descargar').addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = 'captura.png';
  link.click();
});

document.getElementById('subir').addEventListener('click', () => {
  qrDiv.innerHTML = 'Subiendo...';
  canvas.toBlob(async (blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'captura.png');

    try {
      const res = await fetch('https://file.io', { method: 'POST', body: formData });
      const result = await res.json();
      if (result.success) {
        const url = result.link;
        qrDiv.innerHTML = `<a href="${url}" target="_blank">${url}</a>`;
        QRCode.toCanvas(document.createElement('canvas'), url, (err, qrCanvas) => {
          if (!err) qrDiv.appendChild(qrCanvas);
        });
      } else {
        qrDiv.innerHTML = '❌ Error al subir.';
      }
    } catch (e) {
      qrDiv.innerHTML = '❌ Error de conexión.';
    }
  }, 'image/png');
});