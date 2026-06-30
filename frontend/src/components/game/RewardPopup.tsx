import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { RewardPopupData } from "../../game/GameContext";
import { CoinIcon } from "../../icons";

interface RewardPopupProps {
  reward: RewardPopupData | null;
  onClose: () => void;
}

export default function RewardPopup({ reward, onClose }: RewardPopupProps) {
  return createPortal(
    <AnimatePresence>
      {reward && (
        <motion.div
          className="book-sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="reward-popup"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
          >
            {reward.leveledUp && <p className="reward-popup-levelup">Subiu de nível!</p>}
            <h2>Recompensa</h2>
            <div className="reward-popup-items">
              {reward.xp > 0 && <span className="reward-chip">+{reward.xp} XP</span>}
              {reward.coins > 0 && (
                <span className="reward-chip">
                  <CoinIcon width={14} height={14} /> +{reward.coins}
                </span>
              )}
            </div>
            {reward.comboBonus && <p className="hint">Combo de 3 missões hoje! +{50} XP bônus</p>}
            {reward.streakBonus > 0 && <p className="hint">Bônus de sequência: +{reward.streakBonus} moedas</p>}
            <button className="popup-close" onClick={onClose}>
              Continuar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
