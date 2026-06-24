/**
 * Mascotes-robô desenhados em SVG puro (sem libs/imagens externas).
 * 3 variantes visualmente distintas, com poses diferentes. As animações
 * ficam em globals.css e só "esquentam" no hover do desktop (.group:hover).
 *
 * `accent` controla a cor da energia (olhos/núcleo/brilho).
 */
export function Robot({
  variant,
  accent,
  className,
}: {
  variant: 1 | 2 | 3;
  accent: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 150"
      className={className}
      style={{ color: accent }}
      fill="none"
      aria-hidden
    >
      {variant === 1 && <RobotFriendly />}
      {variant === 2 && <RobotLocked />}
      {variant === 3 && <RobotFuturistic />}
    </svg>
  );
}

const METAL = "#1b1e2b";
const METAL_2 = "#2a2e40";

/* IA 1 — amigável, aceno de braço, núcleo pulsando. Pose: braço erguido. */
function RobotFriendly() {
  return (
    <g className="robot-float">
      {/* antena */}
      <line x1="60" y1="22" x2="60" y2="34" stroke="currentColor" strokeWidth="3" />
      <circle cx="60" cy="18" r="5" fill="currentColor" className="robot-glow" />
      {/* cabeça */}
      <rect x="34" y="34" width="52" height="40" rx="14" fill={METAL} stroke="currentColor" strokeWidth="2.5" />
      <circle cx="48" cy="54" r="6" fill="currentColor" className="robot-glow robot-eye" />
      <circle cx="72" cy="54" r="6" fill="currentColor" className="robot-glow robot-eye" />
      <path d="M50 64 Q60 70 70 64" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* corpo */}
      <rect x="38" y="80" width="44" height="42" rx="12" fill={METAL_2} stroke="currentColor" strokeWidth="2.5" />
      <circle cx="60" cy="101" r="8" fill="currentColor" className="robot-glow" opacity="0.9" />
      {/* braço esquerdo (aceno) */}
      <g className="robot-arm">
        <rect x="20" y="78" width="9" height="26" rx="4.5" fill={METAL} stroke="currentColor" strokeWidth="2" transform="rotate(20 24 90)" />
      </g>
      {/* braço direito */}
      <rect x="90" y="86" width="9" height="26" rx="4.5" fill={METAL} stroke="currentColor" strokeWidth="2" />
      {/* pernas */}
      <rect x="46" y="122" width="9" height="18" rx="4" fill={METAL} stroke="currentColor" strokeWidth="2" />
      <rect x="65" y="122" width="9" height="18" rx="4" fill={METAL} stroke="currentColor" strokeWidth="2" />
    </g>
  );
}

/* IA 2 — técnico/bloqueado, visor com scan, cadeado, braços cruzados. */
function RobotLocked() {
  return (
    <g className="robot-shake">
      {/* antenas */}
      <line x1="44" y1="30" x2="40" y2="22" stroke="currentColor" strokeWidth="3" />
      <line x1="76" y1="30" x2="80" y2="22" stroke="currentColor" strokeWidth="3" />
      <circle cx="40" cy="20" r="3.5" fill="currentColor" className="robot-glow" />
      <circle cx="80" cy="20" r="3.5" fill="currentColor" className="robot-glow" />
      {/* cabeça angular */}
      <rect x="34" y="30" width="52" height="38" rx="6" fill={METAL} stroke="currentColor" strokeWidth="2.5" />
      {/* visor com linha de scan */}
      <rect x="40" y="44" width="40" height="11" rx="3" fill="#0c0d14" stroke="currentColor" strokeWidth="2" />
      <rect x="43" y="48" width="34" height="3" rx="1.5" fill="currentColor" className="robot-glow robot-eye" />
      {/* corpo */}
      <rect x="38" y="74" width="44" height="44" rx="8" fill={METAL_2} stroke="currentColor" strokeWidth="2.5" />
      {/* cadeado */}
      <rect x="52" y="92" width="16" height="13" rx="2.5" fill={METAL} stroke="currentColor" strokeWidth="2" />
      <path d="M55 92 v-3 a5 5 0 0 1 10 0 v3" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <circle cx="60" cy="98" r="2.2" fill="currentColor" />
      {/* braços cruzados */}
      <rect x="36" y="82" width="48" height="8" rx="4" fill={METAL} stroke="currentColor" strokeWidth="2" transform="rotate(-12 60 86)" />
      <rect x="36" y="90" width="48" height="8" rx="4" fill={METAL} stroke="currentColor" strokeWidth="2" transform="rotate(12 60 94)" />
      {/* pernas */}
      <rect x="46" y="118" width="9" height="18" rx="3" fill={METAL} stroke="currentColor" strokeWidth="2" />
      <rect x="65" y="118" width="9" height="18" rx="3" fill={METAL} stroke="currentColor" strokeWidth="2" />
    </g>
  );
}

/* IA 3 — futurista/bloqueado, sem pernas, flutua sobre anel de energia. */
function RobotFuturistic() {
  return (
    <g className="robot-float">
      {/* cabeça hexagonal */}
      <path
        d="M60 26 L84 38 L84 60 L60 72 L36 60 L36 38 Z"
        fill={METAL}
        stroke="currentColor"
        strokeWidth="2.5"
      />
      {/* visor horizontal */}
      <rect x="42" y="46" width="36" height="8" rx="4" fill="#0c0d14" stroke="currentColor" strokeWidth="2" />
      <rect x="45" y="48.5" width="30" height="3" rx="1.5" fill="currentColor" className="robot-glow robot-eye" />
      {/* fins laterais */}
      <path d="M36 44 L26 50 L36 56 Z" fill={METAL_2} stroke="currentColor" strokeWidth="2" />
      <path d="M84 44 L94 50 L84 56 Z" fill={METAL_2} stroke="currentColor" strokeWidth="2" />
      {/* corpo afilado */}
      <path d="M46 76 L74 76 L68 110 L52 110 Z" fill={METAL_2} stroke="currentColor" strokeWidth="2.5" />
      <circle cx="60" cy="92" r="6" fill="currentColor" className="robot-glow" />
      {/* propulsão */}
      <path d="M54 110 L66 110 L62 120 L58 120 Z" fill="currentColor" className="robot-glow" opacity="0.8" />
      {/* anel de energia (gira) */}
      <ellipse
        cx="60"
        cy="130"
        rx="26"
        ry="8"
        stroke="currentColor"
        strokeWidth="2.5"
        className="robot-glow robot-ring"
        strokeDasharray="6 5"
      />
    </g>
  );
}
