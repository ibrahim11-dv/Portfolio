const SUPPORTED_MIME = /^image\/(jpeg|png|webp|gif|avif|svg\+xml)$/;

export function readImage(content) {
  if (typeof content !== 'string' || !content.startsWith('{')) return null;
  try {
    const image = JSON.parse(content);
    if (image.type !== 'ubuntu-image' || image.version !== 1 || !SUPPORTED_MIME.test(image.mime || '')) return null;
    if (image.src !== '/portrait.jpg' && !image.src?.startsWith(`data:${image.mime};base64,`)) return null;
    return { ...image, size: Number.isFinite(image.size) && image.size >= 0 ? image.size : 0 };
  } catch { return null; }
}

export function imageFile(src, mime, size) {
  return JSON.stringify({ type: 'ubuntu-image', version: 1, src, mime, size });
}

export function fitImage(width, height, viewport, rotation = 0) {
  if (!width || !height || !viewport.width || !viewport.height) return 1;
  const sideways = Math.abs(rotation % 180) === 90;
  return Math.min(1, Math.max(.01, Math.min((viewport.width - 24) / (sideways ? height : width), (viewport.height - 24) / (sideways ? width : height))));
}
