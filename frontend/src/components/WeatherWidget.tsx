import { useEffect, useImperativeHandle, useState, forwardRef } from "react";
import { motion } from "framer-motion";
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
    <motion.button
      className="reception-card reception-card-clima"
      onClick={() => {
        playSfx("coin");
        onOpen();
      }}
      aria-label="Clima"
      initial={{ opacity: 0, y: 18, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 26, delay: 5 * 0.05 }}
      whileTap={{ scale: 0.94 }}
    >
      {info ? (
        <>
          <span className="reception-card-clima-emoji" aria-hidden="true">
            {info.emoji}
          </span>
          <span className="reception-card-clima-info">
            <span className="reception-card-clima-now">{info.temperature}°</span>
            <span className="reception-card-clima-desc">{info.description}</span>
            <span className="reception-card-clima-minmax">
              {info.today.min}° / {info.today.max}°
            </span>
          </span>
        </>
      ) : (
        <span className="reception-card-clima-desc">🌤️ Toque para configurar o clima</span>
      )}
    </motion.button>
  );
});

export default WeatherWidget;
