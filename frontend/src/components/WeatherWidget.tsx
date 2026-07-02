import { useEffect, useState, type FormEvent } from "react";
import {
  fetchWeather,
  getCachedWeather,
  getSavedPlace,
  savePlace,
  geocodeCity,
  getDeviceLocation,
  type WeatherInfo,
} from "../weather";
import { playSfx } from "../sound";

// Janelinha flutuante de clima na Recepção: graus atuais, mín/máx do dia e o
// estado do tempo. Tocar nela abre a configuração de local (GPS ou cidade).
export default function WeatherWidget() {
  const [info, setInfo] = useState<WeatherInfo | null>(() => getCachedWeather());
  const [configOpen, setConfigOpen] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getSavedPlace()) {
      fetchWeather().then((data) => {
        if (data) setInfo(data);
      });
    }
  }, []);

  async function applyPlaceAndRefresh() {
    const data = await fetchWeather(true);
    if (data) {
      setInfo(data);
      setConfigOpen(false);
      setStatus(null);
    } else {
      setStatus("Não consegui buscar o clima agora — tento de novo mais tarde.");
    }
  }

  async function handleUseLocation() {
    setBusy(true);
    setStatus("Buscando sua localização...");
    const place = await getDeviceLocation();
    if (!place) {
      setStatus("Não consegui acessar a localização. Digite sua cidade abaixo.");
      setBusy(false);
      return;
    }
    savePlace(place);
    await applyPlaceAndRefresh();
    setBusy(false);
  }

  async function handleCitySubmit(e: FormEvent) {
    e.preventDefault();
    if (!cityInput.trim()) return;
    setBusy(true);
    setStatus("Procurando a cidade...");
    const place = await geocodeCity(cityInput.trim());
    if (!place) {
      setStatus("Cidade não encontrada — confere a grafia?");
      setBusy(false);
      return;
    }
    savePlace(place);
    setCityInput("");
    await applyPlaceAndRefresh();
    setBusy(false);
  }

  return (
    <>
      <button
        className="weather-widget"
        onClick={() => {
          playSfx("coin");
          setConfigOpen((v) => !v);
        }}
        aria-label="Clima"
      >
        {info ? (
          <>
            <span className="weather-widget-now">
              {info.emoji} {info.temperature}°
            </span>
            <span className="weather-widget-desc">{info.description}</span>
            <span className="weather-widget-minmax">
              {info.min}° / {info.max}°
            </span>
          </>
        ) : (
          <span className="weather-widget-desc">🌤️ Clima</span>
        )}
      </button>

      {configOpen && (
        <div className="weather-config">
          <p className="hint">
            {info ? `Local atual: ${info.placeName}` : "Configure o local pra ver o clima aqui."}
          </p>
          <button className="small" onClick={handleUseLocation} disabled={busy}>
            Usar minha localização
          </button>
          <form onSubmit={handleCitySubmit} className="weather-config-form">
            <input
              placeholder="Ou digite a cidade"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
            />
            <button type="submit" className="small" disabled={busy}>
              Buscar
            </button>
          </form>
          {status && <p className="hint">{status}</p>}
        </div>
      )}
    </>
  );
}
