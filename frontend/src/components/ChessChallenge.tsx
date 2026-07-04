import { useMemo, useState } from "react";
import { playSfx } from "../sound";

// Desafio "hardcore" do despertador: um único lance de xadrez resolve — dar
// o mate ou escapar dele. Sem motor de xadrez: cada posição é uma jogada
// clássica da literatura (mate do corredor, árabe, do pastor, sufocado...),
// com uma única peça móvel (destacada) e os destinos corretos pré-validados.

type PieceCode = "wK" | "wQ" | "wR" | "wB" | "wN" | "wP" | "bK" | "bQ" | "bR" | "bB" | "bN" | "bP";

const PIECE_GLYPH: Record<PieceCode, string> = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

interface ChessPuzzle {
  title: string;
  goal: string;
  pieces: Record<string, PieceCode>; // "e4" -> peça
  from: string; // única casa com peça móvel
  targets: string[]; // destinos que resolvem o desafio
}

const PUZZLES: ChessPuzzle[] = [
  {
    title: "Mate do corredor",
    goal: "As brancas jogam: dê xeque-mate em um lance com a torre.",
    pieces: {
      g1: "wK", e1: "wR", f2: "wP", g2: "wP", h2: "wP",
      g8: "bK", f7: "bP", g7: "bP", h7: "bP", a5: "bR",
    },
    from: "e1",
    targets: ["e8"],
  },
  {
    title: "Mate árabe",
    goal: "As brancas jogam: o cavalo já domina as casas de fuga — feche o cerco com a torre.",
    pieces: {
      g1: "wK", h1: "wR", f6: "wN", f2: "wP", g2: "wP",
      h8: "bK", g7: "bP", f7: "bP", a8: "bR",
    },
    from: "h1",
    targets: ["h7"],
  },
  {
    title: "Mate do pastor",
    goal: "As brancas jogam: a dama e o bispo miram o mesmo ponto fraco. Mate em um lance.",
    pieces: {
      a1: "wR", b1: "wN", c1: "wB", e1: "wK", g1: "wN", h1: "wR",
      c4: "wB", h5: "wQ", a2: "wP", b2: "wP", c2: "wP", d2: "wP", e4: "wP", f2: "wP", g2: "wP", h2: "wP",
      a8: "bR", c8: "bB", d8: "bQ", e8: "bK", f8: "bB", h8: "bR",
      c6: "bN", f6: "bN", a7: "bP", b7: "bP", c7: "bP", d7: "bP", e5: "bP", f7: "bP", g7: "bP", h7: "bP",
    },
    from: "h5",
    targets: ["f7"],
  },
  {
    title: "Mate sufocado",
    goal: "As brancas jogam: o rei negro está preso pelas próprias peças. Só o cavalo alcança.",
    pieces: {
      g1: "wK", g5: "wN", f2: "wP", g2: "wP", h2: "wP",
      h8: "bK", g8: "bR", f7: "bP", g7: "bP", h7: "bP",
    },
    from: "g5",
    targets: ["f7"],
  },
  {
    title: "Fuja do corredor",
    goal: "A torre negra ameaça mate no corredor — abra uma saída pro seu rei antes que seja tarde.",
    pieces: {
      g1: "wK", h2: "wP", g2: "wP", f2: "wP",
      g8: "bK", d8: "bR", f7: "bP", g7: "bP", h7: "bP",
    },
    from: "h2",
    targets: ["h3", "h4"],
  },
  {
    title: "Bloqueie o xeque",
    goal: "A dama negra deu xeque no seu rei — interrompa a diagonal com o peão.",
    pieces: {
      a1: "wR", b1: "wN", c1: "wB", d1: "wQ", e1: "wK", f1: "wB", g1: "wN", h1: "wR",
      a2: "wP", b2: "wP", c2: "wP", d2: "wP", e2: "wP", g2: "wP", h2: "wP", e5: "wP",
      a8: "bR", b8: "bN", c8: "bB", e8: "bK", f8: "bB", g8: "bN", h8: "bR",
      a7: "bP", b7: "bP", c7: "bP", d7: "bP", f7: "bP", g7: "bP", h7: "bP", h4: "bQ",
    },
    from: "g2",
    targets: ["g3"],
  },
];

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

function squareName(row: number, col: number): string {
  // row 0 = 8ª fileira (topo), col 0 = coluna "a" — brancas embaixo.
  return `${FILES[col]}${8 - row}`;
}

interface ChessChallengeProps {
  onSolved: () => void;
}

export default function ChessChallenge({ onSolved }: ChessChallengeProps) {
  const puzzle = useMemo(() => PUZZLES[Math.floor(Math.random() * PUZZLES.length)], []);
  const [pieces, setPieces] = useState<Record<string, PieceCode>>(puzzle.pieces);
  const [solved, setSolved] = useState(false);
  const [wrongShake, setWrongShake] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleSquareTap(square: string) {
    if (solved || square === puzzle.from) return;
    if (puzzle.targets.includes(square)) {
      const next = { ...pieces };
      next[square] = next[puzzle.from];
      delete next[puzzle.from];
      setPieces(next);
      setSolved(true);
      setFeedback(null);
      playSfx("coin");
      onSolved();
    } else {
      playSfx("drop");
      setFeedback("Não é esse o lance — pense de novo.");
      setWrongShake((n) => n + 1);
    }
  }

  return (
    <div className="chess-challenge">
      <p className="chess-goal">
        <strong>{puzzle.title}.</strong> {puzzle.goal}
      </p>
      <div className="chess-board" key={wrongShake} data-shake={wrongShake > 0 && !solved ? "on" : "off"}>
        {Array.from({ length: 8 }, (_, row) =>
          Array.from({ length: 8 }, (_, col) => {
            const square = squareName(row, col);
            const piece = pieces[square];
            const isDark = (row + col) % 2 === 1;
            const isMovable = square === puzzle.from && !solved;
            return (
              <button
                key={square}
                className={`chess-sq ${isDark ? "dark" : "light"}${isMovable ? " movable" : ""}`}
                onClick={() => handleSquareTap(square)}
                aria-label={square}
              >
                {piece && (
                  <span className={`chess-piece ${piece.startsWith("w") ? "white" : "black"}`}>
                    {PIECE_GLYPH[piece]}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
      {feedback && !solved && <p className="chess-feedback">{feedback}</p>}
    </div>
  );
}
