"use client"

import { type ChordShape } from "@/lib/chordShapes"

const STRING_COUNT = 6
const FRET_COUNT = 5
const STRING_SPACING = 16
const FRET_SPACING = 18
const PADDING = { top: 24, left: 14, right: 14, bottom: 10 }
const DOT_RADIUS = 6
const MARKER_RADIUS = 5

interface ChordDiagramProps {
  shape: ChordShape
  className?: string
}

export default function ChordDiagram({ shape, className }: ChordDiagramProps) {
  const { frets } = shape
  const minFret = Math.min(...frets.filter((f): f is number => f !== "x" && f > 0), 1)
  const startFret = minFret > 1 ? minFret : 1
  const showNut = startFret === 1

  const width = PADDING.left + STRING_SPACING * (STRING_COUNT - 1) + PADDING.right
  const height = PADDING.top + FRET_SPACING * FRET_COUNT + PADDING.bottom

  function fretY(fret: number) {
    return PADDING.top + (fret - startFret) * FRET_SPACING
  }

  function stringX(stringIdx: number) {
    return PADDING.left + stringIdx * STRING_SPACING
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={`shrink-0 ${className ?? ""}`}
      role="img"
      aria-label={shape.name}
    >
      <text
        x={width / 2}
        y={10}
        textAnchor="middle"
        className="fill-foreground text-[10px] font-semibold"
      >
        {shape.name}
      </text>

      {showNut ? (
        <rect
          x={PADDING.left - 2}
          y={PADDING.top - 2}
          width={STRING_SPACING * (STRING_COUNT - 1) + 4}
          height={3}
          rx={1}
          className="fill-foreground"
        />
      ) : (
        <text
          x={PADDING.left - 8}
          y={fretY(startFret) + FRET_SPACING / 2 + 1}
          textAnchor="end"
          className="fill-muted-foreground text-[9px] leading-none"
        >
          {startFret}
        </text>
      )}

      {Array.from({ length: FRET_COUNT + 1 }, (_, i) => (
        <line
          key={`fret-${i}`}
          x1={PADDING.left}
          y1={fretY(startFret + i)}
          x2={PADDING.left + STRING_SPACING * (STRING_COUNT - 1)}
          y2={fretY(startFret + i)}
          className="stroke-foreground/30"
          strokeWidth={i === 0 && showNut ? 2 : 0.8}
        />
      ))}

      {Array.from({ length: STRING_COUNT }, (_, i) => (
        <line
          key={`string-${i}`}
          x1={stringX(i)}
          y1={PADDING.top}
          x2={stringX(i)}
          y2={fretY(startFret + FRET_COUNT)}
          className="stroke-foreground/20"
          strokeWidth={0.6}
        />
      ))}

      {frets.map((fret, i) => {
        const x = stringX(i)
        if (fret === "x") {
          return (
            <g key={`dot-${i}`}>
              <line
                x1={x - MARKER_RADIUS}
                y1={PADDING.top - MARKER_RADIUS - 6}
                x2={x + MARKER_RADIUS}
                y2={PADDING.top - MARKER_RADIUS - 6 + MARKER_RADIUS * 2}
                className="stroke-muted-foreground"
                strokeWidth={1.5}
              />
              <line
                x1={x + MARKER_RADIUS}
                y1={PADDING.top - MARKER_RADIUS - 6}
                x2={x - MARKER_RADIUS}
                y2={PADDING.top - MARKER_RADIUS - 6 + MARKER_RADIUS * 2}
                className="stroke-muted-foreground"
                strokeWidth={1.5}
              />
            </g>
          )
        }
        if (fret === 0) {
          return (
            <circle
              key={`dot-${i}`}
              cx={x}
              cy={PADDING.top - 8}
              r={MARKER_RADIUS}
              className="stroke-foreground"
              fill="none"
              strokeWidth={1.2}
            />
          )
        }
        const y = fretY(fret) + FRET_SPACING / 2
        const finger = shape.fingers?.[i]
        return (
          <g key={`dot-${i}`}>
            <circle cx={x} cy={y} r={DOT_RADIUS} className="fill-primary" />
            {finger && (
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                className="fill-primary-foreground text-[7px] font-medium leading-none"
              >
                {finger}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
