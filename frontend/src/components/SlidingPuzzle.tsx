import { useMemo, useState } from "react";
import { playSfx } from "../sound";

const SIZE = 4;
const BLANK = 0; // 0 representa o espaço vazio

// Embaralha aplicando N movimentos válidos a partir do estado resolvido —
// garante um tabuleiro sempre solucionável (embaralhar aleatório puro gera
// metade dos casos impossíveis de resolver).
function shuffledBoard(moves = 140): number[] {
  const board = [...Array.from({ length: SIZE * SIZE - 1 }, (_, i) => i + 1), BLANK];
  let blank = board.length - 1;
  let previous = -1;
  for (let i = 0; i < moves; i++) {
    const neighbors = neighborsOf(blank).filter((n) => n !== previous);
    const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
    board[blank] = board[pick];
    board[pick] = BLANK;
    previous = blank;
    blank = pick;
  }
  return board;
}

function neighborsOf(index: number): number[] {
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  const result: number[] = [];
  if (row > 0) result.push(index - SIZE);
  if (row < SIZE - 1) result.push(index + SIZE);
  if (col > 0) result.push(index - 1);
  if (col < SIZE - 1) result.push(index + 1);
  return result;
}

function isSolved(board: number[]): boolean {
  for (let i = 0; i < board.length - 1; i++) {
    if (board[i] !== i + 1) return false;
  }
  return true;
}

interface SlidingPuzzleProps {
  onSolved: () => void;
}

export default function SlidingPuzzle({ onSolved }: SlidingPuzzleProps) {
  const initial = useMemo(() => shuffledBoard(), []);
  const [board, setBoard] = useState<number[]>(initial);
  const [solved, setSolved] = useState(false);

  function handleTileTap(index: number) {
    if (solved) return;
    const blank = board.indexOf(BLANK);
    if (!neighborsOf(index).includes(blank)) return;
    const next = [...board];
    next[blank] = next[index];
    next[index] = BLANK;
    setBoard(next);
    playSfx("drop");
    if (isSolved(next)) {
      setSolved(true);
      onSolved();
    }
  }

  return (
    <div className="sliding-puzzle" role="grid" aria-label="Quebra-cabeça deslizante 4x4">
      {board.map((value, index) => (
        <button
          key={index}
          className={`puzzle-tile${value === BLANK ? " blank" : ""}`}
          onClick={() => handleTileTap(index)}
          disabled={value === BLANK}
        >
          {value !== BLANK && value}
        </button>
      ))}
    </div>
  );
}
