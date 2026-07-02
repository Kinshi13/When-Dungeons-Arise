import { useEffect, useState } from "react";
import { fetchPrimaryWeather, getCachedPrimaryWeather, listPlaces, type WeatherInfo } from "../weather";
import WeatherScreen from "./WeatherScreen";
import { playSfx } from "../sound";

// Janelinha flutuante de clima na Recepção: graus atuais, mín/máx e estado
// do tempo do local principal. Tocar abre a tela completa de Clima (previsão
// de amanhã + outros locais).
export default function WeatherWidget() {
  const [info, setInfo] = useState<WeatherInfo | null>(() => getCachedPrimaryWeather());
  const [screenOpen, setScreenOpen] = useState(false);

  function refresh() {
    setInfo(getCachedPrimaryWeather());
    if (listPlaces().length > 0) {
      fetchPrimaryWeather().then((data) => {
        if (data) setInfo(data);
      });
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <>
      <button
        className="weather-widget"
        onClick={() => {
          playSfx("coin");
          setScreenOpen(true);
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
              {info.today.min}° / {info.today.max}°
            </span>
          </>
        ) : (
          <span className="weather-widget-desc">🌤️ Clima</span>
        )}
      </button>

      <WeatherScreen
        open={screenOpen}
        onClose={() => {
          setScreenOpen(false);
          refresh();
        }}
        onPlacesChanged={refresh}
      />
    </>
  );
}
