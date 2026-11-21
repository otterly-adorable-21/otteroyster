// Detects which optional brand images exist in /assets and turns them on.
// Each one adds a class to <html> (e.g. "has-logo") that CSS uses to swap
// the drawn fallback for the real artwork.
const ART = {
  logo: 'assets/logo.png',
  emblem: 'assets/emblem.png',
  lilies: 'assets/lily-border.png',
  pond: 'assets/pond.jpg',
  float: 'assets/otter-float.jpg',
};

function probe(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 0);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

export const art = {};

export async function detectArt() {
  await Promise.all(Object.entries(ART).map(async ([key, src]) => {
    art[key] = (await probe(src)) ? src : null;
    document.documentElement.classList.toggle(`has-${key}`, !!art[key]);
  }));
  if (art.emblem) {
    document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]').forEach((l) => { l.href = art.emblem; l.type = 'image/png'; });
    document.querySelectorAll('img[data-emblem]').forEach((img) => { img.src = art.emblem; });
  }
  return art;
}
