// Partículas ambiente opcionais (seção 27 do spec): poeira sutil nas telas
// Lo-fi em geral, chuva na Sala do Tempo (combina com o tema noturno/lavanda
// dela). Só CSS (transform/opacity, sem JS por frame) — a quantidade some
// gradualmente conforme o nível de animação escolhido em Ajustes (ver
// index.css: :root[data-animation-level]), e prefers-reduced-motion do
// sistema sempre desliga tudo, independente da preferência salva no app.
const DUST_COUNT = 14;
const RAIN_COUNT = 24;

// Posições/atrasos fixos (não Math.random() a cada render) — gerados uma vez
// aqui, então cada partícula sempre cai no mesmo lugar/tempo relativo, só a
// CSS anima o loop.
function seeded(count: number, seed: number) {
  return Array.from({ length: count }, (_, i) => {
    const x = ((i * 137.5 + seed) % 100).toFixed(1);
    const delay = ((i * 0.83 + seed * 0.13) % 8).toFixed(2);
    const duration = (6 + ((i * 1.7) % 5)).toFixed(2);
    return { x, delay, duration };
  });
}

const DUST_PARTICLES = seeded(DUST_COUNT, 3);
const RAIN_PARTICLES = seeded(RAIN_COUNT, 11);

interface AmbientParticlesProps {
  kind: "dust" | "rain";
}

export default function AmbientParticles({ kind }: AmbientParticlesProps) {
  const particles = kind === "rain" ? RAIN_PARTICLES : DUST_PARTICLES;
  return (
    <div className={`ambient-particles ambient-particles-${kind}`} aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          className="ambient-particle"
          style={{
            left: `${p.x}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
