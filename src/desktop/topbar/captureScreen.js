export async function captureDesktop() {
  const desktop = document.querySelector('.desktop');
  if (!desktop) throw new Error('Le bureau n’est pas encore prêt.');
  // Capture the portfolio itself, without requesting access to another application.
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const { toBlob } = await import('html-to-image');
  const blob = await toBlob(desktop, {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    preferredFontFormat: 'woff2',
    filter: node => !(node instanceof Element && node.matches('.ubuntu-capture, .desktop-dialog, .desktop-notice, .ubuntu-shell-notice')),
  });
  if (!blob) throw new Error('Impossible de capturer le bureau. Réessayez.');
  return URL.createObjectURL(blob);
}

export async function captureScreen() {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error('La capture n’est pas disponible dans ce navigateur. Utilisez la capture d’écran de votre appareil.');
  }
  let stream;
  let timeout;
  const video = document.createElement('video');
  video.muted = true;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false, preferCurrentTab: true });
    // Let the launch dialog disappear before sampling the chosen surface.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    video.srcObject = stream;
    await Promise.race([
      (async () => {
        await video.play();
        if (video.requestVideoFrameCallback) {
          await new Promise((resolve) => video.requestVideoFrameCallback(resolve));
        }
      })(),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('La capture a expiré. Réessayez.')), 8000); }),
    ]);
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    if (!canvas.width || !canvas.height) throw new Error('Aucune image reçue. Réessayez.');
    canvas.getContext('2d').drawImage(video, 0, 0);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Impossible de créer l’image.');
    return URL.createObjectURL(blob);
  } finally {
    clearTimeout(timeout);
    stream?.getTracks().forEach((track) => track.stop());
    video.pause();
    video.srcObject = null;
  }
}
