import { createId } from "./core/repositories/storage";

// Clima via Open-Meteo — gratuita, sem chave e com CORS liberado pra uso
// direto do navegador/WebView (confirmado: access-control-allow-origin: *).
// Suporta vários locais salvos (Casa, Trabalho, Escola...): o primeiro da
// lista é o "principal" — é ele que aparece na janelinha da Recepção e no
// aviso de clima quando o despertador toca.

export interface WeatherPlace {
  id: string;
  label: string; // apelido dado pelo usuário: "Casa", "Trabalho"...
  latitude: number;
  longitude: number;
}

export interface DayForecast {
  min: number;
  max: number;
  description: string;
  emoji: string;
  precipChance: number | null; // % de chance de chuva (máx do dia)
}

export interface WeatherInfo {
  placeId: string;
  placeLabel: string;
  temperature: number;
  description: string;
  emoji: string;
  today: DayForecast;
  tomorrow: DayForecast;
  fetchedAt: string;
}

const PLACES_KEY = "lembretes-app:weather-places";
const LEGACY_PLACE_KEY = "lembretes-app:weather-place";
const CACHE_KEY = "lembretes-app:weather-cache-v2";
const CACHE_TTL_MS = 30 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;

// Códigos WMO agrupados em descrições práticas (o que interessa é saber se
// vai chover/está limpo, não a taxonomia completa).
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

export function listPlaces(): WeatherPlace[] {
  try {
    const raw = localStorage.getItem(PLACES_KEY);
    if (raw) return JSON.parse(raw);
    // Migração: quem configurou o clima na versão de local único vira o
    // primeiro item da lista, mantendo o nome que já tinha.
    const legacy = localStorage.getItem(LEGACY_PLACE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      const migrated: WeatherPlace[] = [
        { id: createId(), label: parsed.name ?? "Casa", latitude: parsed.latitude, longitude: parsed.longitude },
      ];
      localStorage.setItem(PLACES_KEY, JSON.stringify(migrated));
      localStorage.removeItem(LEGACY_PLACE_KEY);
      return migrated;
    }
    return [];
  } catch {
    return [];
  }
}

export function addPlace(label: string, latitude: number, longitude: number): WeatherPlace {
  const places = listPlaces();
  const place: WeatherPlace = { id: createId(), label, latitude, longitude };
  places.push(place);
  localStorage.setItem(PLACES_KEY, JSON.stringify(places));
  return place;
}

export function removePlace(id: string) {
  localStorage.setItem(PLACES_KEY, JSON.stringify(listPlaces().filter((p) => p.id !== id)));
  const cache = loadCache();
  delete cache[id];
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function loadCache(): Record<string, WeatherInfo> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getCachedWeather(placeId: string): WeatherInfo | null {
  return loadCache()[placeId] ?? null;
}

export function getCachedPrimaryWeather(): WeatherInfo | null {
  const primary = listPlaces()[0];
  return primary ? getCachedWeather(primary.id) : null;
}

function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
}

// Busca cidade por nome (pra quem prefere digitar em vez de usar o GPS).
export async function geocodeCity(name: string): Promise<{ latitude: number; longitude: number; city: string } | null> {
  try {
    const res = await fetchWithTimeout(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=pt&format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const hit = data.results?.[0];
    if (!hit) return null;
    return { latitude: hit.latitude, longitude: hit.longitude, city: hit.name };
  } catch {
    return null;
  }
}

// Localização do próprio aparelho (pede permissão na primeira vez).
export function getDeviceLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
  });
}

// Clima atual + previsão de hoje e de amanhã pra um local. Usa cache de
// 30min; se a rede falhar devolve o cache mesmo vencido (informação velha é
// melhor que nenhuma).
export async function fetchWeatherFor(place: WeatherPlace, force = false): Promise<WeatherInfo | null> {
  const cached = getCachedWeather(place.id);
  if (!force && cached && Date.now() - new Date(cached.fetchedAt).getTime() < CACHE_TTL_MS) {
    return cached;
  }

  try {
    const res = await fetchWithTimeout(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
        `&current=temperature_2m,weather_code` +
        `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max` +
        `&timezone=auto&forecast_days=2`
    );
    if (!res.ok) return cached;
    const data = await res.json();

    function dayAt(index: number): DayForecast {
      const code = data.daily?.weather_code?.[index] ?? 0;
      const { description, emoji } = describeWeatherCode(code);
      const precip = data.daily?.precipitation_probability_max?.[index];
      return {
        min: Math.round(data.daily?.temperature_2m_min?.[index] ?? 0),
        max: Math.round(data.daily?.temperature_2m_max?.[index] ?? 0),
        description,
        emoji,
        precipChance: typeof precip === "number" ? Math.round(precip) : null,
      };
    }

    const currentCode = data.current?.weather_code ?? data.daily?.weather_code?.[0] ?? 0;
    const { description, emoji } = describeWeatherCode(currentCode);
    const info: WeatherInfo = {
      placeId: place.id,
      placeLabel: place.label,
      temperature: Math.round(data.current?.temperature_2m ?? 0),
      description,
      emoji,
      today: dayAt(0),
      tomorrow: dayAt(1),
      fetchedAt: new Date().toISOString(),
    };
    const cache = loadCache();
    cache[place.id] = info;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    return info;
  } catch {
    return cached;
  }
}

export async function fetchPrimaryWeather(force = false): Promise<WeatherInfo | null> {
  const primary = listPlaces()[0];
  return primary ? fetchWeatherFor(primary, force) : null;
}
