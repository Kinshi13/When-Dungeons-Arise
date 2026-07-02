// Clima via Open-Meteo — gratuita, sem chave e com CORS liberado pra uso
// direto do navegador/WebView (confirmado: access-control-allow-origin: *).

export interface WeatherPlace {
  latitude: number;
  longitude: number;
  name: string;
}

export interface WeatherInfo {
  temperature: number;
  min: number;
  max: number;
  weatherCode: number;
  description: string;
  emoji: string;
  placeName: string;
  fetchedAt: string;
}

const PLACE_KEY = "lembretes-app:weather-place";
const CACHE_KEY = "lembretes-app:weather-cache";
const CACHE_TTL_MS = 30 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;

// Códigos WMO agrupados em descrições práticas (o que interessa é saber se
// vai chover/venta/está limpo, não a taxonomia completa).
function describeWeatherCode(code: number): { description: string; emoji: string } {
  if (code === 0) return { description: "Céu limpo", emoji: "☀️" };
  if (code <= 2) return { description: "Parcialmente nublado", emoji: "⛅" };
  if (code === 3) return { description: "Nublado", emoji: "☁️" };
  if (code === 45 || code === 48) return { description: "Neblina", emoji: "🌫️" };
  if (code >= 51 && code <= 57) return { description: "Garoa", emoji: "🌦️" };
  if (code >= 61 && code <= 67) return { description: "Chuva", emoji: "🌧️" };
  if (code >= 71 && code <= 77) return { description: "Neve", emoji: "🌨️" };
  if (code >= 80 && code <= 82) return { description: "Pancadas de chuva", emoji: "🌧️" };
  if (code >= 95) return { description: "Tempestade", emoji: "⛈️" };
  return { description: "Tempo instável", emoji: "🌥️" };
}

export function getSavedPlace(): WeatherPlace | null {
  try {
    const raw = localStorage.getItem(PLACE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function savePlace(place: WeatherPlace) {
  localStorage.setItem(PLACE_KEY, JSON.stringify(place));
  localStorage.removeItem(CACHE_KEY);
}

export function getCachedWeather(): WeatherInfo | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
}

// Busca cidade por nome (pra quem prefere digitar em vez de usar o GPS).
export async function geocodeCity(name: string): Promise<WeatherPlace | null> {
  try {
    const res = await fetchWithTimeout(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=pt&format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const hit = data.results?.[0];
    if (!hit) return null;
    return { latitude: hit.latitude, longitude: hit.longitude, name: hit.name };
  } catch {
    return null;
  }
}

// Localização do próprio aparelho (pede permissão na primeira vez).
export function getDeviceLocation(): Promise<WeatherPlace | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, name: "Minha localização" }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
  });
}

// Clima atual + mín/máx do dia. Usa cache de 30min; se a rede falhar devolve
// o cache mesmo vencido (informação velha > nenhuma informação).
export async function fetchWeather(force = false): Promise<WeatherInfo | null> {
  const place = getSavedPlace();
  if (!place) return null;

  const cached = getCachedWeather();
  if (!force && cached && Date.now() - new Date(cached.fetchedAt).getTime() < CACHE_TTL_MS) {
    return cached;
  }

  try {
    const res = await fetchWithTimeout(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
        `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code` +
        `&timezone=auto&forecast_days=1`
    );
    if (!res.ok) return cached;
    const data = await res.json();
    const code = data.current?.weather_code ?? data.daily?.weather_code?.[0] ?? 0;
    const { description, emoji } = describeWeatherCode(code);
    const info: WeatherInfo = {
      temperature: Math.round(data.current?.temperature_2m ?? 0),
      min: Math.round(data.daily?.temperature_2m_min?.[0] ?? 0),
      max: Math.round(data.daily?.temperature_2m_max?.[0] ?? 0),
      weatherCode: code,
      description,
      emoji,
      placeName: place.name,
      fetchedAt: new Date().toISOString(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(info));
    return info;
  } catch {
    return cached;
  }
}
