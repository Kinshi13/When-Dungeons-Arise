import { useEffect, useImperativeHandle, useState, forwardRef } from "react";
import { fetchPrimaryWeather, getCachedPrimaryWeather, listPlaces, type WeatherInfo } from "../weather";
import { playSfx } from "../sound";

export interface WeatherWidgetHandle {
  refresh: () => void;
}

interface WeatherWidgetProps {
  onOpen: () => void;
}

// Janelinha flutuante de clima na Recepção: graus atuais, mín/máx e estado
// do tempo do local principal. Tocar (ou deslizar pra baixo na Recepção)
// abre a tela completa de Clima — controlada pela Recepção (GuildReception),
// não por aqui, pra poder ser aberta também pelo gesto vertical.
const WeatherWidget = forwardRef<WeatherWidgetHandle, WeatherWidgetProps>(function WeatherWidget({ onOpen }, ref) {
  const [info, setInfo] = useState<WeatherInfo | null>(() => getCachedPrimaryWeather());

  function refresh() {
    setInfo(getCachedPrimaryWeather());
    if (listPlaces().length > 0) {
      fetchPrimaryWeather().then((data) => {
        if (data) setInfo(data);
      });
    }
  }

  useImperativeHandle(ref, () => ({ refresh }));

  useEffect(() => {
    refresh();
  }, []);

  return (
    <button
      className="weather-widget"
      onClick={() => {
        playSfx("coin");
        onOpen();
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
  );
});

export default WeatherWidget;
