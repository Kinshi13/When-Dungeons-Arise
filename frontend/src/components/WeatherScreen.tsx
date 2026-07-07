import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fullscreenSheetFade } from "../motion";
import {
  listPlaces,
  addPlace,
  removePlace,
  fetchWeatherFor,
  getCachedWeather,
  geocodeCity,
  getDeviceLocation,
  type WeatherPlace,
  type WeatherInfo,
} from "../weather";
import { ChevronLeftIcon, TrashIcon, PlusIcon } from "../icons";
import { playSfx } from "../sound";
import { useVerticalSwipe } from "../useVerticalSwipe";

interface WeatherScreenProps {
  open: boolean;
  onClose: () => void;
  onPlacesChanged?: () => void;
}

export default function WeatherScreen({ open, onClose, onPlacesChanged }: WeatherScreenProps) {
  const [places, setPlaces] = useState<WeatherPlace[]>([]);
  const [infoByPlace, setInfoByPlace] = useState<Record<string, WeatherInfo | null>>({});
  const [labelInput, setLabelInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function refresh() {
    const list = listPlaces();
    setPlaces(list);
    // Mostra o cache imediatamente e atualiza cada local em paralelo.
    setInfoByPlace(Object.fromEntries(list.map((p) => [p.id, getCachedWeather(p.id)])));
    for (const place of list) {
      fetchWeatherFor(place).then((info) => {
        if (info) setInfoByPlace((prev) => ({ ...prev, [place.id]: info }));
      });
    }
  }

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  async function resolveNewPlaceCoords(): Promise<{ latitude: number; longitude: number } | null> {
    if (cityInput.trim()) {
      const hit = await geocodeCity(cityInput.trim());
      if (!hit) {
        setStatus("Cidade não encontrada (ou sem internet agora) — tente de novo.");
        return null;
      }
      return hit;
    }
    const loc = await getDeviceLocation();
    if (!loc) {
      setStatus("Não consegui acessar a localização — digite a cidade no campo acima.");
      return null;
    }
    return loc;
  }

  async function handleAddPlace(e: FormEvent) {
    e.preventDefault();
    const label = labelInput.trim();
    if (!label) {
      setStatus("Dê um nome pro local (Casa, Trabalho, Escola...).");
      return;
    }
    setBusy(true);
    setStatus(cityInput.trim() ? "Procurando a cidade..." : "Buscando sua localização...");
    const coords = await resolveNewPlaceCoords();
    if (coords) {
      playSfx("coin");
      addPlace(label, coords.latitude, coords.longitude);
      setLabelInput("");
      setCityInput("");
      setStatus(null);
      refresh();
      onPlacesChanged?.();
    }
    setBusy(false);
  }

  function handleRemove(id: string) {
    removePlace(id);
    refresh();
    onPlacesChanged?.();
  }

  const primary = places[0];
  const primaryInfo = primary ? infoByPlace[primary.id] : null;
  const others = places.slice(1);

  // Mesmo gesto que abre esta tela (deslizar pra baixo na Recepção): deslizar
  // pra baixo de novo aqui fecha de volta (não o reverso). Só no cabeçalho,
  // pra não brigar com a rolagem dos cards de outros locais.
  const closeSwipe = useVerticalSwipe(undefined, onClose);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="note-fullscreen weather-screen"
          {...fullscreenSheetFade}
        >
          <div className="lofi-scene lofi-scene-tempo" aria-hidden="true" />

          <div className="note-fullscreen-content weather-screen-content">
            <div className="note-fullscreen-header" {...closeSwipe}>
              <button className="icon-btn" onClick={onClose} aria-label="Voltar">
                <ChevronLeftIcon width={20} height={20} /> Voltar
              </button>
              <strong>Clima</strong>
            </div>

            {primary && (
              <section className="weather-primary">
                <span className="weather-primary-label">{primary.label}</span>
                {primaryInfo ? (
                  <>
                    <div className="weather-primary-now">
                      {primaryInfo.emoji} {primaryInfo.temperature}°C
                    </div>
                    <div className="weather-primary-desc">{primaryInfo.description}</div>
                    <div className="weather-day-cards">
                      <div className="weather-day-card">
                        <span className="weather-day-title">Hoje</span>
                        <span className="weather-day-emoji">{primaryInfo.today.emoji}</span>
                        <span className="weather-day-minmax">
                          {primaryInfo.today.min}° / {primaryInfo.today.max}°
                        </span>
                        <span className="weather-day-desc">{primaryInfo.today.description}</span>
                        {primaryInfo.today.precipChance !== null && (
                          <span className="weather-day-precip">☔ {primaryInfo.today.precipChance}%</span>
                        )}
                      </div>
                      <div className="weather-day-card">
                        <span className="weather-day-title">Amanhã</span>
                        <span className="weather-day-emoji">{primaryInfo.tomorrow.emoji}</span>
                        <span className="weather-day-minmax">
                          {primaryInfo.tomorrow.min}° / {primaryInfo.tomorrow.max}°
                        </span>
                        <span className="weather-day-desc">{primaryInfo.tomorrow.description}</span>
                        {primaryInfo.tomorrow.precipChance !== null && (
                          <span className="weather-day-precip">☔ {primaryInfo.tomorrow.precipChance}%</span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="hint">Buscando o clima... (precisa de internet na primeira vez)</p>
                )}
              </section>
            )}

            {others.length > 0 && (
              <section>
                <h2>Outros locais</h2>
                <div className="weather-place-grid">
                  {others.map((place) => {
                    const info = infoByPlace[place.id];
                    return (
                      <div key={place.id} className="weather-place-card">
                        <div className="weather-place-card-top">
                          <span className="weather-place-label">{place.label}</span>
                          <button
                            className="weather-place-remove"
                            onClick={() => handleRemove(place.id)}
                            aria-label={`Remover ${place.label}`}
                          >
                            <TrashIcon width={14} height={14} />
                          </button>
                        </div>
                        {info ? (
                          <>
                            <span className="weather-widget-now">
                              {info.emoji} {info.temperature}°
                            </span>
                            <span className="weather-widget-desc">{info.description}</span>
                            <span className="weather-widget-minmax">
                              {info.today.min}° / {info.today.max}°
                            </span>
                          </>
                        ) : (
                          <span className="weather-widget-desc">Sem dados ainda</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="weather-add-section">
              <h2>{places.length === 0 ? "Configurar clima" : "Adicionar local"}</h2>
              {places.length === 0 && (
                <p className="hint">
                  Adicione seu primeiro local — ele vira o principal, mostrado na Recepção e no
                  aviso do despertador.
                </p>
              )}
              <form onSubmit={handleAddPlace} className="form weather-add-form">
                <input
                  placeholder="Nome (Casa, Trabalho, Escola...)"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                />
                <input
                  placeholder="Cidade (vazio = usar GPS)"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                />
                <button type="submit" className="icon-btn primary" aria-label="Adicionar local" disabled={busy}>
                  <PlusIcon width={16} height={16} />
                </button>
              </form>
              {status && <p className="hint">{status}</p>}
            </section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
