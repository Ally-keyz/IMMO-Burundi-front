/**
 * Decorative "between two perpendicular buildings" backdrop for the
 * Explore hero. One-point-perspective SVG: floor lines + wall columns
 * radiate from a distant vanishing point and run off-canvas, so the
 * structures read as receding endlessly into the background.
 */
const VP_X = 700;
const VP_Y = 180;
const RATIO = 1.28;
const GAP0 = 10;
const REACH = 420;
const FLOORS_DOWN = 22;
const FLOORS_UP = 8;

/** Horizontal floor lines whose spacing and reach shrink toward the VP. */
interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  o: number;
}

function floorLines(): Line[] {
  const out: Line[] = [];
  for (let side = -1; side <= 1; side += 2) {
    for (let k = 0; k <= (side < 0 ? FLOORS_DOWN : FLOORS_UP); k++) {
      const y = VP_Y + side * GAP0 * RATIO ** k;
      const reach = REACH / RATIO ** k;
      if (reach < 10) break;
      out.push({ x1: VP_X - reach, y1: y, x2: VP_X + reach, y2: y, o: side < 0 ? 0.7 : 0.45 });
    }
  }
  return out;
}

/** Wall columns: radiating lines from the VP to bases below the canvas. */
function wallLines(): Line[] {
  const out: Line[] = [];
  const baseY = 820;
  for (const dir of [-1, 1]) {
    let x = VP_X + dir * 22;
    let step = 22;
    const limit = dir * 900;
    let guard = 0;
    while (dir * x < dir * limit && guard++ < 24) {
      out.push({ x1: x, y1: baseY, x2: VP_X, y2: VP_Y, o: 0.5 });
      step *= 1.22;
      x += dir * step;
    }
  }
  return out;
}

const FLOORS = floorLines();
const WALLS = wallLines();

export default function FacadeBackdrop(): JSX.Element {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block"
      style={{
        WebkitMaskImage: 'radial-gradient(115% 150% at 50% 34%, black 26%, transparent 82%)',
        maskImage: 'radial-gradient(115% 150% at 50% 34%, black 26%, transparent 82%)',
      }}
    >
      <svg
        className="absolute left-1/2 top-[-180px] h-[700px] -translate-x-1/2"
        width="1400"
        height="700"
        viewBox="0 0 1400 700"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="facade-glow">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="rgb(230 235 245)" />
            <stop offset="100%" stopColor="rgb(230 235 245 / 0)" />
          </radialGradient>
        </defs>

        {/* Distant exit glow at the vanishing point */}
        <circle cx={VP_X} cy={VP_Y} r={170} fill="url(#facade-glow)" opacity="0.6" />

        {/* Wall columns receding */}
        {WALLS.map((l, i) => (
          <line
            key={`w${i}`}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="#dcdcdc"
            strokeWidth="1"
            opacity={l.o}
          />
        ))}

        {/* Floor lines receding */}
        {FLOORS.map((l, i) => (
          <line
            key={`f${i}`}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="#e2e2e2"
            strokeWidth="1"
            opacity={l.o}
          />
        ))}

        {/* Near silhouette of both buildings' corners (offscreen, hint) */}
        <line x1="0" y1="200" x2="0" y2="700" stroke="#d4d4d4" strokeWidth="2" opacity="0.4" />
        <line x1="1400" y1="200" x2="1400" y2="700" stroke="#d4d4d4" strokeWidth="2" opacity="0.4" />
      </svg>
    </div>
  );
}