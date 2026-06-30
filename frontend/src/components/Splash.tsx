import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MIN_DURATION_MS = 1400;

export default function Splash() {
  const [visible, setVisible] = useState(true);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), MIN_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="splash-logo"
            initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
          >
            {!imgFailed ? (
              <img
                src="/logo-star.png"
                alt="Lembretes"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <svg viewBox="0 0 100 100" className="splash-star-fallback">
                <polygon
                  points="50,4 61,38 97,38 68,59 79,93 50,72 21,93 32,59 3,38 39,38"
                  fill="var(--accent)"
                  stroke="var(--border)"
                  strokeWidth="3"
                />
              </svg>
            )}
          </motion.div>
          <motion.p
            className="splash-title"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            LEMBRETES
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
