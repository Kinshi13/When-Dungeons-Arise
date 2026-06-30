import type { ReactNode } from "react";

interface PixelDialogBoxProps {
  speaker?: string;
  children: ReactNode;
}

export default function PixelDialogBox({ speaker, children }: PixelDialogBoxProps) {
  return (
    <div className="pixel-dialog">
      {speaker && <div className="pixel-dialog-speaker">{speaker}</div>}
      <p className="pixel-dialog-text">{children}</p>
      <div className="pixel-dialog-tail" />
    </div>
  );
}
