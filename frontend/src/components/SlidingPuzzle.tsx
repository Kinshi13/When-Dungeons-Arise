import { useMemo, useState } from "react";
import { playSfx } from "../sound";

const BLANK = 0; // 0 representa o espaço vazio

// Embaralha aplicando N movimentos válidos a partir do estado resolvido —
// garante um tabuleiro sempre solucionável (embaralhar aleatório puro gera
// metade dos casos impossíveis de resolver). Sem "anti-backtrack": num
// tabuleiro 2x2 cada casa só tem 2 vizinhos, então excluir o movimento
// anterior deixava só 1 escolha possível a cada passo — o embaralhamento
// virava determinístico e sempre voltava pro estado resolvido, travando a
// tentativa de re-embaralhar (recursão infinita, "Maximum call stack
// exceeded" em produção). Permitir "desfazer" o último passo
// ocasionalmente é inofensivo: o resultado final continua bem embaralhado.
function shuffleOnce(size: number): number[] {
  const board = [...Array.from({ length: size * size - 1 }, (_, i) => i + 1), BLANK];
  let blank = board.length - 1;
  const moves = size * size * 12;
  for (let i = 0; i < moves; i++) {
    const neighbors = neighborsOf(blank, size);
    const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
    board[blank] = board[pick];
    board[pick] = BLANK;
    blank = pick;
  }
  return board;
}

// Loop limitado (não recursão) por segurança: mesmo com o determinismo acima
// corrigido, um embaralhamento genuinamente aleatório ainda pode, raramente,
// terminar de volta no estado resolvido.
function shuffledBoard(size: number): number[] {
  for (let attempt = 0; attempt < 20; attempt++) {
    const board = shuffleOnce(size);
    if (!isSolved(board)) return board;
  }
  return shuffleOnce(size);
}

function neighborsOf(index: number, size: number): number[] {
  const row = Math.floor(index / size);
  const col = index % size;
  const result: number[] = [];
  if (row > 0) result.push(index - size);
  if (row < size - 1) result.push(index + size);
  if (col > 0) result.push(index - 1);
  if (col < size - 1) result.push(index + 1);
  return result;
}

function isSolved(board: number[]): boolean {
  for (let i = 0; i < board.length - 1; i++) {
    if (board[i] !== i + 1) return false;
  }
  return true;
}

interface SlidingPuzzleProps {
  size?: 2 | 3 | 4;
  onSolved: () => void;
}

export default function SlidingPuzzle({ size = 4, onSolved }: SlidingPuzzleProps) {
  const initial = useMemo(() => shuffledBoard(size), [size]);
  const [board, setBoard] = useState<number[]>(initial);
  const [solved, setSolved] = useState(false);

  function handleTileTap(index: number) {
    if (solved) return;
    const blank = board.indexOf(BLANK);
    if (!neighborsOf(index, size).includes(blank)) return;
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
    <div
      className="sliding-puzzle"
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      role="grid"
      aria-label={`Quebra-cabeça deslizante ${size}x${size}`}
    >
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
