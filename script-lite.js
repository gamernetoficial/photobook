console.log("✅ Activando versión Lite por compatibilidad.");

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

navigator.mediaDevices?.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      renderPreview();
    };
  })