// Detects which brand images exist in /assets and turns them on.
// Prefers the small web-optimized copies in assets/web/, and falls back to the
// full-size originals, so newly uploaded art works even before it's optimized.
// Each image found adds a class to <html> (e.g. "has-logo") that CSS uses to
// swap the drawn fallback for the real artwork.
const ART = {
  logo: ['assets/web/logo.webp', 'assets/logo.png'],
  emblem: ['assets/web/emblem.webp', 'assets/emblem.png'],
  lilies: ['assets/web/lily-border.webp', 'assets/lily-border.png'],
  pond: ['assets/web/pond.webp', 'assets/pond.png', 'assets/pond.jpg'],
  float: ['assets/web/otter-float.webp', 'assets/otter-float.png', 'assets/otter-float.jpg'],
};

function probe(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 0);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

async function first(list) {
  for (const src of list) if (await probe(src)) return src;
  return null;
}

export const art = {};

export async function detectArt() {
  await Promise.all(Object.entries(ART).map(async ([key, list]) => {
    art[key] = await first(list);
    document.documentElement.classList.toggle(`has-${key}`, !!art[key]);
  }));
  const set = (sel, src) => { if (src) document.querySelectorAll(sel).forEach((el) => { if (el.getAttribute('src') !== src) el.src = src; }); };
  set('img[data-art="logo"]', art.logo);
  set('img[data-art="emblem"]', art.emblem);
  set('img[data-art="lilies"]', art.lilies);
  set('img[data-art="float"]', art.float);
  if (art.pond) document.documentElement.style.setProperty('--pond-url', `url("${new URL(art.pond, location.href).href}")`);
  return art;
}
