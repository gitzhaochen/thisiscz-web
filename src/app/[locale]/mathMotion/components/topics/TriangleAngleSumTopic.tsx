'use client'

import { FormulaBox, Hint, NumberControl, TopicPanel } from '../TopicUi'
import { Play, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const lerp = (from: number, to: number, t: number) => from + (to - from) * t
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

type Point = { x: number; y: number }

const FAN_VERTEX: Point = { x: 360, y: 235 }
const FAN_RADIUS = 120
const CORNER_RADIUS = 36

const toRad = (deg: number) => (deg * Math.PI) / 180

/** 从正东方向逆时针（度）→ SVG 坐标 */
const polarFromEast = (origin: Point, radius: number, deg: number): Point => {
  const rad = toRad(deg)
  return { x: origin.x + radius * Math.cos(rad), y: origin.y - radius * Math.sin(rad) }
}

const vectorAngle = (from: Point, to: Point) => {
  const dx = to.x - from.x
  const dy = from.y - to.y
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI
  if (deg < 0) deg += 360
  return deg
}

const shortestLerp = (from: number, to: number, t: number) => {
  let delta = to - from
  while (delta > 180) delta -= 360
  while (delta < -180) delta += 360
  return from + delta * t
}

const sectorPath = (origin: Point, radius: number, startDeg: number, endDeg: number) => {
  const start = polarFromEast(origin, radius, startDeg)
  const end = polarFromEast(origin, radius, endDeg)
  const sweep = endDeg - startDeg
  const largeArc = Math.abs(sweep) > 180 ? 1 : 0
  return `M ${origin.x} ${origin.y} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y} Z`
}

/** 根据两邻边方向，取与 expectedSpread 匹配的内角扇形 */
const interiorSector = (vertex: Point, p1: Point, p2: Point, expectedSpread: number) => {
  const a1 = vectorAngle(vertex, p1)
  const a2 = vectorAngle(vertex, p2)
  const ccw = ((a2 - a1 + 360) % 360)
  const cw = ((a1 - a2 + 360) % 360)
  if (Math.abs(ccw - expectedSpread) <= Math.abs(cw - expectedSpread)) {
    return { start: a1, end: a1 + ccw }
  }
  return { start: a2, end: a2 + cw }
}

function computeTriangle(angleB: number, angleC: number) {
  const angleA = 180 - angleB - angleC
  if (angleA <= 0) return null

  const B0: Point = { x: 0, y: 0 }
  const C0: Point = { x: 280, y: 0 }

  const radB = toRad(angleB)
  const radC = toRad(180 - angleC)
  const dirB = { x: Math.cos(radB), y: -Math.sin(radB) }
  const dirC = { x: Math.cos(radC), y: -Math.sin(radC) }

  const cross = dirB.x * dirC.y - dirB.y * dirC.x
  if (Math.abs(cross) < 1e-6) return null

  const dx = C0.x - B0.x
  const t = (dx * dirC.y) / cross
  if (t <= 0) return null

  const A0: Point = { x: B0.x + t * dirB.x, y: B0.y + t * dirB.y }
  const height = -A0.y
  if (height <= 0) return null

  const maxHeight = 155
  const scale = Math.min(1, maxHeight / height)
  const offsetX = 220
  const offsetY = 270

  const map = (p: Point): Point => ({
    x: offsetX + p.x * scale,
    y: offsetY + p.y * scale,
  })

  return {
    A: map(A0),
    B: map(B0),
    C: map(C0),
    angleA,
    angleB,
    angleC,
  }
}

export default function TriangleAngleSumTopic() {
  const [angleB, setAngleB] = useState(55)
  const [angleC, setAngleC] = useState(65)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)

  const triangle = useMemo(() => computeTriangle(angleB, angleC), [angleB, angleC])
  const validTriangle = triangle !== null
  const angleA = triangle?.angleA ?? 0

  const stopAnimation = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const play = () => {
    if (playing || !validTriangle) return
    setPlaying(true)
    setProgress(0)
    const start = performance.now()
    const duration = 2400

    const tick = (now: number) => {
      const t = easeInOut(clamp((now - start) / duration, 0, 1))
      setProgress(t)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setPlaying(false)
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  const restore = () => {
    stopAnimation()
    setPlaying(false)
    setProgress(0)
  }

  useEffect(() => () => stopAnimation(), [])

  const assemblyT = easeInOut(clamp((progress - 0.15) / 0.85, 0, 1))
  const isAssembled = assemblyT > 0.92

  const sectors = triangle
    ? (() => {
        const { A, B, C } = triangle
        const fanStarts = [0, angleA, angleA + angleB]
        const spreads = [angleA, angleB, angleC]
        const vertices = [A, B, C]
        const neighbors: [Point, Point][] = [
          [B, C],
          [C, A],
          [A, B],
        ]
        const styles = [
          { key: 'A', label: '∠A', fill: '#c4b5fd88', stroke: '#7c3aed' },
          { key: 'B', label: '∠B', fill: '#bbf7d088', stroke: '#16a34a' },
          { key: 'C', label: '∠C', fill: '#fde68a99', stroke: '#d97706' },
        ]

        return styles.map((style, idx) => {
          const tri = interiorSector(vertices[idx], neighbors[idx][0], neighbors[idx][1], spreads[idx])
          const fanStart = fanStarts[idx]
          const spread = spreads[idx]
          const start = shortestLerp(tri.start, fanStart, assemblyT)
          const radius = lerp(CORNER_RADIUS, FAN_RADIUS, assemblyT)

          return {
            ...style,
            origin: {
              x: lerp(vertices[idx].x, FAN_VERTEX.x, assemblyT),
              y: lerp(vertices[idx].y, FAN_VERTEX.y, assemblyT),
            },
            start,
            end: start + spread,
            spread,
            radius,
          }
        })
      })()
    : []

  const lineLeft = FAN_VERTEX.x - FAN_RADIUS
  const lineRight = FAN_VERTEX.x + FAN_RADIUS

  return (
    <TopicPanel
      title="三角形的内角和 180° 定理"
      subtitle="先猜想，再用拼叠法验证，最后用平行线完成推理论证。"
      controls={
        <div className="space-y-4">
          <NumberControl id="triangle-angle-b" label="∠B" value={angleB} min={20} max={140} step={1} unit="°" onChange={setAngleB} />
          <NumberControl id="triangle-angle-c" label="∠C" value={angleC} min={20} max={140} step={1} unit="°" onChange={setAngleC} />
          <FormulaBox
            label="内角和定理"
            formula="∠A + ∠B + ∠C = 180°"
            value={validTriangle ? `∠A = ${angleA}°` : '请调整角度使内角和为 180°'}
          />
          <button
            type="button"
            disabled={playing || !validTriangle}
            onClick={play}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {playing ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {playing ? '拼叠中...' : '播放拼叠动画'}
          </button>
          {progress > 0 ? (
            <button
              type="button"
              onClick={restore}
              className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" />
              还原三角形
            </button>
          ) : null}
          <Hint>
            <span className="block font-semibold">验证思路（拼叠法）</span>
            <span className="mt-1 block">把三角形的三个内角剪下，拼在一起，刚好组成一个平角 180°。</span>
            <span className="mt-2 block font-semibold">证明思路（平行线法）</span>
            <span className="mt-1 block">过顶点 A 作 BC 的平行线 EF，利用内错角相等，得 ∠B=∠1，∠C=∠2。</span>
            <span className="mt-1 block">又因为 ∠1+∠BAC+∠2=180°，所以 ∠A+∠B+∠C=180°。</span>
          </Hint>
        </div>
      }
    >
      <svg viewBox="0 0 720 360" className="w-full">
        {assemblyT > 0.05 ? (
          <>
            <line x1={lineLeft} y1={FAN_VERTEX.y} x2={lineRight} y2={FAN_VERTEX.y} stroke="#64748b" strokeWidth="3" />
            <line x1={lineLeft} y1={FAN_VERTEX.y} x2={lineLeft - 18} y2={FAN_VERTEX.y} stroke="#64748b" strokeWidth="2.5" />
            <line x1={lineRight} y1={FAN_VERTEX.y} x2={lineRight + 18} y2={FAN_VERTEX.y} stroke="#64748b" strokeWidth="2.5" />
            <text x={lineRight + 24} y={FAN_VERTEX.y + 5} fill="#64748b" fontSize="13" fontWeight="600">
              180°
            </text>
          </>
        ) : null}

        {triangle && !isAssembled ? (
          <>
            <polygon
              points={`${triangle.A.x},${triangle.A.y} ${triangle.B.x},${triangle.B.y} ${triangle.C.x},${triangle.C.y}`}
              fill="#dbeafe"
              stroke="#2563eb"
              strokeWidth="3"
              opacity={lerp(1, 0.2, assemblyT)}
            />
            <text x={triangle.A.x} y={triangle.A.y - 12} textAnchor="middle" fill="#2563eb" fontSize="15" fontWeight="700" opacity={lerp(1, 0, assemblyT)}>
              A
            </text>
            <text x={triangle.B.x - 14} y={triangle.B.y + 18} fill="#2563eb" fontSize="15" fontWeight="700" opacity={lerp(1, 0, assemblyT)}>
              B
            </text>
            <text x={triangle.C.x + 6} y={triangle.C.y + 18} fill="#2563eb" fontSize="15" fontWeight="700" opacity={lerp(1, 0, assemblyT)}>
              C
            </text>
          </>
        ) : null}

        {sectors.map((sector) => {
          const labelPoint = polarFromEast(sector.origin, sector.radius * 0.7, sector.start + sector.spread / 2)
          return (
            <g key={sector.key}>
              <path
                d={sectorPath(sector.origin, sector.radius, sector.start, sector.end)}
                fill={sector.fill}
                stroke={sector.stroke}
                strokeWidth="2.5"
              />
              <text x={labelPoint.x} y={labelPoint.y} textAnchor="middle" fill={sector.stroke} fontSize="12" fontWeight="700">
                {sector.label}
              </text>
            </g>
          )
        })}

        {isAssembled ? (
          <>
            <text x={FAN_VERTEX.x} y={FAN_VERTEX.y + 48} textAnchor="middle" fill="#334155" fontSize="15" fontWeight="700">
              {angleA}° + {angleB}° + {angleC}° = 180°
            </text>
            <text x={FAN_VERTEX.x} y={FAN_VERTEX.y + 70} textAnchor="middle" fill="#64748b" fontSize="13">
              三个内角恰好拼成一条直线（平角）
            </text>
          </>
        ) : null}

        {progress > 0 && progress < 0.15 ? (
          <text x={360} y={320} textAnchor="middle" fill="#64748b" fontSize="14">
            正在剪下内角……
          </text>
        ) : null}
      </svg>
    </TopicPanel>
  )
}
