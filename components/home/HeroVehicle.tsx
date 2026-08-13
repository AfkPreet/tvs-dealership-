'use client';

/**
 * The hero vehicle, drawn in SVG from the same normalised side profile the 360°
 * stand-in renders are built from — so the homepage machine and the model-page
 * machine are unmistakably the same object.
 *
 * Each layer is its own group so the vehicle can assemble on scroll. Only
 * `transform` and `opacity` are ever animated.
 */

type Pt = [number, number, number];

// x spans 60→940 across the vehicle's length; y is measured up from the ground.
const X0 = 500;
const XR = 440;
const GROUND = 560;
const YR = 440;

const map = (points: Pt[]) =>
  points.map(([u, v]) => `${(X0 + u * XR).toFixed(1)},${(GROUND - v * YR).toFixed(1)}`).join(' ');

const UNDERBODY: Pt[] = [
  [0.42, 0.3, 0], [0.28, 0.27, 0], [0.05, 0.255, 0], [-0.2, 0.26, 0], [-0.42, 0.3, 0],
  [-0.62, 0.34, 0], [-0.8, 0.32, 0], [-0.86, 0.24, 0], [-0.6, 0.2, 0], [-0.2, 0.185, 0],
  [0.1, 0.185, 0], [0.36, 0.21, 0],
];

const APRON: Pt[] = [
  [0.98, 0.28, 0], [1.0, 0.44, 0], [0.96, 0.62, 0], [0.88, 0.78, 0], [0.78, 0.87, 0],
  [0.62, 0.885, 0], [0.54, 0.8, 0], [0.5, 0.62, 0], [0.46, 0.44, 0], [0.4, 0.3, 0],
  [0.52, 0.28, 0], [0.7, 0.26, 0], [0.88, 0.24, 0],
];

const REAR_BODY: Pt[] = [
  [-0.1, 0.32, 0], [-0.2, 0.46, 0], [-0.3, 0.58, 0], [-0.4, 0.635, 0], [-0.62, 0.65, 0],
  [-0.84, 0.63, 0], [-0.94, 0.54, 0], [-0.98, 0.42, 0], [-0.92, 0.32, 0], [-0.7, 0.28, 0],
  [-0.4, 0.285, 0],
];

const SEAT: Pt[] = [
  [-0.34, 0.645, 0], [-0.52, 0.685, 0], [-0.74, 0.69, 0], [-0.9, 0.655, 0],
  [-0.89, 0.615, 0], [-0.72, 0.635, 0], [-0.5, 0.635, 0], [-0.35, 0.61, 0],
];

// Headlamp, set into the apron.
const LAMP: Pt[] = [
  [0.98, 0.55, 0], [0.95, 0.66, 0], [0.86, 0.70, 0], [0.82, 0.62, 0], [0.88, 0.52, 0], [0.95, 0.48, 0],
];

// Floor-level accent strip running the length of the step-through.
const STRIPE: Pt[] = [
  [0.40, 0.315, 0], [-0.10, 0.30, 0], [-0.12, 0.265, 0], [0.40, 0.28, 0],
];

const WHEEL_U = 0.688;
const WHEEL_R = 119;
const WHEEL_Y = GROUND - WHEEL_R;

export type HeroLayer = 'wheels' | 'under' | 'rear' | 'apron' | 'seat' | 'accent';

export function HeroVehicle({ layerStyle }: { layerStyle: (layer: HeroLayer) => React.CSSProperties }) {
  return (
    <svg
      viewBox="40 96 920 500"
      className="h-auto w-full"
      role="img"
      aria-label="Illustration of a TVS scooter"
      focusable="false"
    >
      <defs>
        <radialGradient id="hero-floor" cx="50%" cy="92%" r="58%">
          <stop offset="0" stopColor="#2A2B31" />
          <stop offset="1" stopColor="#0E0E10" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx={X0} cy={GROUND + 8} rx={330} ry={26} fill="url(#hero-floor)" />

      <g style={layerStyle('wheels')}>
        {[WHEEL_U, -WHEEL_U].map((u) => (
          <g key={u} transform={`translate(${X0 + u * XR} ${WHEEL_Y})`}>
            <circle r={WHEEL_R} fill="#212429" />
            <circle r={WHEEL_R * 0.66} fill="#43484F" />
            <circle r={WHEEL_R * 0.24} fill="#6B7079" />
          </g>
        ))}
      </g>

      <g style={layerStyle('under')}>
        <polygon points={map(UNDERBODY)} fill="#3B3F46" />
      </g>

      <g style={layerStyle('rear')}>
        <polygon points={map(REAR_BODY)} fill="#B4192A" stroke="#D9455A" strokeWidth="2" />
      </g>

      <g style={layerStyle('apron')}>
        <polygon points={map(APRON)} fill="#98151F" stroke="#C43B4C" strokeWidth="2" />
      </g>

      <g style={layerStyle('seat')}>
        <polygon points={map(SEAT)} fill="#2F323A" stroke="#4A4E57" strokeWidth="1.5" />
        {/* Handlebar: a stem rising out of the apron, then the bar across it. */}
        <rect x={X0 + 0.655 * XR} y={GROUND - 0.95 * YR} width={12} height={44} fill="#43484F" />
        <rect x={X0 + 0.60 * XR} y={GROUND - 0.965 * YR} width={62} height={15} rx={5} fill="#4E535B" />
      </g>

      <g style={layerStyle('accent')}>
        <polygon points={map(STRIPE)} fill="#8A9099" />
        <polygon points={map(LAMP)} fill="#EDEFF2" />
      </g>
    </svg>
  );
}
