const CACHE_NAME = "mentaru-shindan-v32";
const KEYS = ["ramen", "udon", "soba", "pasta", "yakisoba", "somen"];
const ROOT_URL = new URL("./", self.registration.scope);
const siteUrl = (path) => new URL(path, ROOT_URL).href;
const CHARACTER_PATHS = KEYS.flatMap((family) =>
  KEYS.map((method) => "characters/" + family + "-" + method + ".webp"),
);
const CORE_PATHS = [
  "./",
  "manifest.webmanifest",
  "og.png",
  "characters/all-characters-top.webp",
  "brand/mentaru-shindan-logo.webp",
  ...CHARACTER_PATHS,
];

async function saveResponse(cache, path) {
  const url = siteUrl(path);
  try {
    const response = await fetch(url, { cache: "reload" });
    if (response.ok) await cache.put(url, response.clone());
    return response;
  } catch {
    return undefined;
  }
}

async function precache() {
  const cache = await caches.open(CACHE_NAME);
  const root = await saveResponse(cache, "./");

  if (root) {
    const html = await root.text();
    const linked = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
      .map((match) => new URL(match[1], ROOT_URL))
      .filter((url) => url.origin === ROOT_URL.origin && url.href.startsWith(ROOT_URL.href))
      .map((url) => url.href);
    await Promise.all([...new Set(linked)].map((url) => saveResponse(cache, url)));
  }

  await Promise.all(CORE_PATHS.slice(1).map((path) => saveResponse(cache, path)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(event.request);
        if (response.ok) event.waitUntil(cache.put(event.request, response.clone()));
        return response;
      } catch {
        return (
          (await cache.match(event.request)) ||
          (event.request.mode === "navigate" ? await cache.match(siteUrl("./")) : undefined) ||
          Response.error()
        );
      }
    })(),
  );
});