import React, { useMemo, useState } from 'react';
import { CompassCoordinates, PartyResult } from '../types';
import { Compass } from 'lucide-react';

interface PoliticalCompassProps {
  userCompass: CompassCoordinates;
  rankings: PartyResult[];
}

const GRID_LEFT = 48;
const GRID_TOP = 28;
const GRID_SIZE = 264;
const HALF = GRID_SIZE / 2;
const CENTER_X = GRID_LEFT + HALF; // 180
const CENTER_Y = GRID_TOP + HALF; // 160

function toSvgCoords(economico: number, social: number): { x: number; y: number } {
  const clampedEco = Math.max(-100, Math.min(100, economico));
  const clampedSoc = Math.max(-100, Math.min(100, social));
  return {
    x: CENTER_X + (clampedEco / 100) * HALF,
    y: CENTER_Y - (clampedSoc / 100) * HALF,
  };
}

function formatAxisValue(val: number): string {
  const rounded = Math.round(val * 10) / 10;
  if (Object.is(rounded, -0)) return '0.0';
  return rounded > 0 ? `+${rounded.toFixed(1)}` : rounded.toFixed(1);
}

interface PlacedLabel {
  id: string;
  label: string;
  color: string;
  dotX: number;
  dotY: number;
  labelX: number;
  labelY: number;
  anchor: 'start' | 'middle' | 'end';
}

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function boxesOverlap(a: Box, b: Box): boolean {
  return !(a.x2 <= b.x1 || a.x1 >= b.x2 || a.y2 <= b.y1 || a.y1 >= b.y2);
}

function computePartyLabelPositions(
  rankings: PartyResult[],
  userX: number,
  userY: number
): PlacedLabel[] {
  const placedBoxes: Box[] = [
    // Reservar espacio alrededor del punto del usuario
    { x1: userX - 18, y1: userY - 22, x2: userX + 18, y2: userY + 12 },
  ];

  const candidateOffsets: {
    dx: number;
    dy: number;
    anchor: 'start' | 'middle' | 'end';
  }[] = [
    { dx: 0, dy: -9, anchor: 'middle' },
    { dx: 0, dy: 15, anchor: 'middle' },
    { dx: 8, dy: 3, anchor: 'start' },
    { dx: -8, dy: 3, anchor: 'end' },
    { dx: 8, dy: -7, anchor: 'start' },
    { dx: -8, dy: -7, anchor: 'end' },
    { dx: 8, dy: 12, anchor: 'start' },
    { dx: -8, dy: 12, anchor: 'end' },
    { dx: 8, dy: 21, anchor: 'start' },
    { dx: -8, dy: 21, anchor: 'end' },
    { dx: 8, dy: -14, anchor: 'start' },
    { dx: -8, dy: -14, anchor: 'end' },
    { dx: -14, dy: 4, anchor: 'end' },
    { dx: 14, dy: 4, anchor: 'start' },
    { dx: 0, dy: -18, anchor: 'middle' },
    { dx: 0, dy: 24, anchor: 'middle' },
  ];

  return rankings.map((r) => {
    const { x: dotX, y: dotY } = toSvgCoords(
      r.compass.economico,
      r.compass.social
    );
    const label = r.party.id;
    const approxWidth = label.length * 5.6 + 4;
    const approxHeight = 11;

    let best = {
      labelX: dotX,
      labelY: dotY - 9,
      anchor: 'middle' as 'start' | 'middle' | 'end',
      box: { x1: 0, y1: 0, x2: 0, y2: 0 },
    };

    let foundClean = false;

    for (const cand of candidateOffsets) {
      const lx = dotX + cand.dx;
      const ly = dotY + cand.dy;
      const x1 =
        cand.anchor === 'start'
          ? lx
          : cand.anchor === 'end'
          ? lx - approxWidth
          : lx - approxWidth / 2;
      const x2 = x1 + approxWidth;
      const y1 = ly - approxHeight + 2;
      const y2 = ly + 2;

      const insideGrid =
        x1 >= GRID_LEFT + 2 &&
        x2 <= GRID_LEFT + GRID_SIZE - 2 &&
        y1 >= GRID_TOP + 2 &&
        y2 <= GRID_TOP + GRID_SIZE - 2;

      if (!insideGrid) continue;

      const candBox: Box = { x1, y1, x2, y2 };
      const collides = placedBoxes.some((b) => boxesOverlap(candBox, b));

      if (!collides) {
        best = { labelX: lx, labelY: ly, anchor: cand.anchor, box: candBox };
        foundClean = true;
        break;
      }
    }

    if (!foundClean) {
      // Fallback seguro dentro del recuadro respetando bordes
      const nearRight = dotX > CENTER_X + HALF * 0.65;
      const nearLeft = dotX < CENTER_X - HALF * 0.65;
      const anchor: 'start' | 'middle' | 'end' = nearRight
        ? 'end'
        : nearLeft
        ? 'start'
        : 'middle';
      const lx =
        anchor === 'end'
          ? Math.min(GRID_LEFT + GRID_SIZE - 4, dotX - 8)
          : anchor === 'start'
          ? Math.max(GRID_LEFT + 4, dotX + 8)
          : Math.max(
              GRID_LEFT + approxWidth / 2 + 4,
              Math.min(GRID_LEFT + GRID_SIZE - approxWidth / 2 - 4, dotX)
            );
      const ly =
        dotY > GRID_TOP + 22 ? dotY - 9 : dotY + 15;
      const x1 =
        anchor === 'start'
          ? lx
          : anchor === 'end'
          ? lx - approxWidth
          : lx - approxWidth / 2;
      best = {
        labelX: lx,
        labelY: ly,
        anchor,
        box: {
          x1,
          y1: ly - approxHeight + 2,
          x2: x1 + approxWidth,
          y2: ly + 2,
        },
      };
    }

    placedBoxes.push(best.box);

    return {
      id: r.party.id,
      label,
      color: r.party.color,
      dotX,
      dotY,
      labelX: best.labelX,
      labelY: best.labelY,
      anchor: best.anchor,
    };
  });
}

export const PoliticalCompass: React.FC<PoliticalCompassProps> = ({
  userCompass,
  rankings,
}) => {
  const [showParties, setShowParties] = useState(false);

  const userPoint = useMemo(
    () => toSvgCoords(userCompass.economico, userCompass.social),
    [userCompass.economico, userCompass.social]
  );

  const partyMarkers = useMemo(
    () =>
      showParties
        ? computePartyLabelPositions(rankings, userPoint.x, userPoint.y)
        : [],
    [showParties, rankings, userPoint.x, userPoint.y]
  );

  const hasCompassData =
    userCompass.economicoCount > 0 || userCompass.socialCount > 0;

  // Evitar que la etiqueta "Tú" se salga por arriba del gráfico
  const userLabelY =
    userPoint.y < GRID_TOP + 24 ? userPoint.y + 18 : userPoint.y - 12;

  return (
    <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90 flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-600" />
          <h2 className="text-base font-extrabold text-slate-900">
            Tu Brújula Política
          </h2>
        </div>
      </div>

      {/* Switch para ver los 8 partidos en el mapa */}
      <button
        type="button"
        role="switch"
        aria-checked={showParties}
        onClick={() => setShowParties((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl border text-left transition cursor-pointer ${
          showParties
            ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950'
            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80'
        }`}
      >
        <span className="text-xs font-bold">
          Ver posición de los partidos en el mapa
        </span>
        <div
          className={`w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
            showParties ? 'bg-indigo-600' : 'bg-slate-300'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
              showParties ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </div>
      </button>

      {/* Gráfico SVG 2D */}
      <div className="w-full flex justify-center">
        <svg
          viewBox="0 0 360 324"
          className="w-full max-w-[360px] h-auto select-none"
          role="img"
          aria-label={`Brújula política: Económico ${formatAxisValue(
            userCompass.economico
          )}, Social ${formatAxisValue(userCompass.social)}`}
        >
          <defs>
            <clipPath id="compass-grid-clip">
              <rect
                x={GRID_LEFT}
                y={GRID_TOP}
                width={GRID_SIZE}
                height={GRID_SIZE}
                rx={12}
              />
            </clipPath>
          </defs>

          {/* Etiquetas de ejes */}
          <text
            x={CENTER_X}
            y={17}
            textAnchor="middle"
            className="fill-slate-700 font-bold"
            fontSize="11"
          >
            Conservador (+100)
          </text>
          <text
            x={CENTER_X}
            y={312}
            textAnchor="middle"
            className="fill-slate-700 font-bold"
            fontSize="11"
          >
            Progresista (-100)
          </text>
          <text
            x={22}
            y={CENTER_Y}
            textAnchor="middle"
            transform={`rotate(-90 22 ${CENTER_Y})`}
            className="fill-slate-700 font-bold"
            fontSize="11"
          >
            Izquierda (-100)
          </text>
          <text
            x={338}
            y={CENTER_Y}
            textAnchor="middle"
            transform={`rotate(90 338 ${CENTER_Y})`}
            className="fill-slate-700 font-bold"
            fontSize="11"
          >
            Derecha (+100)
          </text>

          {/* 4 Cuadrantes de colores suaves */}
          <g clipPath="url(#compass-grid-clip)">
            {/* Arriba-Izquierda: Violeta muy suave */}
            <rect
              x={GRID_LEFT}
              y={GRID_TOP}
              width={HALF}
              height={HALF}
              fill="#f3e8ff"
            />
            {/* Arriba-Derecha: Azul grisáceo suave */}
            <rect
              x={CENTER_X}
              y={GRID_TOP}
              width={HALF}
              height={HALF}
              fill="#e4ebf5"
            />
            {/* Abajo-Izquierda: Rojo/rosado suave */}
            <rect
              x={GRID_LEFT}
              y={CENTER_Y}
              width={HALF}
              height={HALF}
              fill="#ffe4e6"
            />
            {/* Abajo-Derecha: Amarillo/crema suave */}
            <rect
              x={CENTER_X}
              y={CENTER_Y}
              width={HALF}
              height={HALF}
              fill="#fef9c3"
            />

            {/* Líneas secundarias (-50 y +50) */}
            <line
              x1={CENTER_X - HALF / 2}
              y1={GRID_TOP}
              x2={CENTER_X - HALF / 2}
              y2={GRID_TOP + GRID_SIZE}
              stroke="#94a3b8"
              strokeOpacity="0.25"
              strokeDasharray="3 3"
            />
            <line
              x1={CENTER_X + HALF / 2}
              y1={GRID_TOP}
              x2={CENTER_X + HALF / 2}
              y2={GRID_TOP + GRID_SIZE}
              stroke="#94a3b8"
              strokeOpacity="0.25"
              strokeDasharray="3 3"
            />
            <line
              x1={GRID_LEFT}
              y1={CENTER_Y - HALF / 2}
              x2={GRID_LEFT + GRID_SIZE}
              y2={CENTER_Y - HALF / 2}
              stroke="#94a3b8"
              strokeOpacity="0.25"
              strokeDasharray="3 3"
            />
            <line
              x1={GRID_LEFT}
              y1={CENTER_Y + HALF / 2}
              x2={GRID_LEFT + GRID_SIZE}
              y2={CENTER_Y + HALF / 2}
              stroke="#94a3b8"
              strokeOpacity="0.25"
              strokeDasharray="3 3"
            />

            {/* Ejes principales (0, 0) */}
            <line
              x1={CENTER_X}
              y1={GRID_TOP}
              x2={CENTER_X}
              y2={GRID_TOP + GRID_SIZE}
              stroke="#64748b"
              strokeOpacity="0.45"
              strokeWidth="1.25"
            />
            <line
              x1={GRID_LEFT}
              y1={CENTER_Y}
              x2={GRID_LEFT + GRID_SIZE}
              y2={CENTER_Y}
              stroke="#64748b"
              strokeOpacity="0.45"
              strokeWidth="1.25"
            />
          </g>

          {/* Borde del recuadro */}
          <rect
            x={GRID_LEFT}
            y={GRID_TOP}
            width={GRID_SIZE}
            height={GRID_SIZE}
            rx={12}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* Puntos de los 8 partidos (si el switch está activo) */}
          {partyMarkers.map((pm) => (
            <g key={pm.id}>
              <circle
                cx={pm.dotX}
                cy={pm.dotY}
                r={5.2}
                fill={pm.color}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <text
                x={pm.labelX}
                y={pm.labelY}
                textAnchor={pm.anchor}
                fontSize="8.5"
                fontWeight="800"
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth="2.8"
                paintOrder="stroke"
              >
                {pm.label}
              </text>
            </g>
          ))}

          {/* Punto principal del usuario */}
          {hasCompassData && (
            <g>
              <circle
                cx={userPoint.x}
                cy={userPoint.y}
                r={13}
                fill="#4f46e5"
                fillOpacity="0.18"
              />
              <circle
                cx={userPoint.x}
                cy={userPoint.y}
                r={7}
                fill="#4f46e5"
                stroke="#ffffff"
                strokeWidth="2.5"
              />
              <text
                x={userPoint.x}
                y={userLabelY}
                textAnchor="middle"
                fontSize="10"
                fontWeight="900"
                fill="#312e81"
                stroke="#ffffff"
                strokeWidth="3"
                paintOrder="stroke"
              >
                Tú
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Dos píldoras con los valores numéricos exactos (-100 a +100) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
          <span className="text-xs font-extrabold text-slate-800">
            Económico:{' '}
            <span className="font-mono text-indigo-700">
              {formatAxisValue(userCompass.economico)}
            </span>
          </span>
        </div>
        <div className="px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
          <span className="text-xs font-extrabold text-slate-800">
            Social:{' '}
            <span className="font-mono text-indigo-700">
              {formatAxisValue(userCompass.social)}
            </span>
          </span>
        </div>
      </div>

      {!hasCompassData && (
        <p className="text-[11px] text-amber-700 text-center font-medium">
          En los bloques filtrados actuales no hay preguntas asignadas a los
          ejes económico o social.
        </p>
      )}

      {/* Nota obligatoria en cursiva */}
      <p className="text-[11px] italic text-slate-500 text-center leading-relaxed">
        Esta brújula no tiene en cuenta el modelo territorial, la lengua ni la
        política de defensa.
      </p>
    </section>
  );
};
