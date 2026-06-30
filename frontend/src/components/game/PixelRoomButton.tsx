import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { playSfx } from "../../sound";

interface PixelRoomButtonProps {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export default function PixelRoomButton({ to, label, icon }: PixelRoomButtonProps) {
  const navigate = useNavigate();

  return (
    <motion.button
      className="room-button"
      whileTap={{ scale: 0.92 }}
      onClick={() => {
        playSfx("coin");
        navigate(to);
      }}
    >
      <span className="room-button-icon">{icon}</span>
      <span className="room-button-label">{label}</span>
    </motion.button>
  );
}
