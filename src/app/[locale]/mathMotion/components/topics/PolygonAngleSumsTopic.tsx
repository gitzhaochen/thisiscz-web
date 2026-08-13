'use client'

import { FormulaBox, Hint, TopicPanel } from '../TopicUi'
import { Play, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

type PolygonMode = 4 | 5 | 6 | 7 | 8

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

const pointAt = (cx: number, cy: number, radius: number, deg: number) => {
  const rad = (deg * Math.PI) / 180
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
}

export default function PolygonAngleSumsTopic() {
  const t = useTranslations('PageMathMotion.polygonAngleSums')
  const tc = useTranslations('PageMathMotion.common')
  const [mode, setMode] = useState<PolygonMode>(4)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)

  const n = mode
  const triangleCount = n - 2
  const interiorSum = triangleCount * 180
  const exteriorSum = 360

  const stopAnimation = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const play = () => {
    if (playing) return
    setPlaying(true)
    setProgress(0)
    const start = performance.now()
    const duration = 2400

    const tick = (now: number) => {
      const tAnim = easeInOut(clamp((now - start) / duration, 0, 1))
      setProgress(tAnim)
      if (tAnim < 1) {
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

  const polygon = useMemo(() => {
    // 初始居中；播放后略左移，给右侧说明留空
    const centerX = progress > 0 ? 250 : 360
    const centerY = 170
    const radiusMap: Record<PolygonMode, number> = {
      4: 120,
      5: 120,
      6: 115,
      7: 110,
      8: 105,
    }
    const radius = radiusMap[mode]
    const startDeg = -90
    const step = 360 / mode
    return Array.from({ length: mode }, (_, i) => pointAt(centerX, centerY, radius, startDeg + i * step))
  }, [mode, progress])

  const triangleLineCount = mode - 3 // 从同一个顶点画对角线数量
  const visibleLines = Math.floor(progress * (triangleLineCount + 0.001))
  const showFinal = progress > 0.92
  const showExteriorGuides = progress > 0.6

  return (
    <TopicPanel
      title={t('title')}
      subtitle={t('subtitle')}
      controls={
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {([4, 5, 6, 7, 8] as const).map((sides) => (
              <button
                key={sides}
                type="button"
                onClick={() => {
                  restore()
                  setMode(sides)
                }}
                className={`rounded-lg px-2 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                  mode === sides ? 'bg-indigo-600 text-white' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {t('nGon', { n: sides })}
              </button>
            ))}
          </div>

          <FormulaBox label={t('interiorLabel')} formula="(n - 2) × 180°" value={`(${n} - 2) × 180° = ${interiorSum}°`} />
          <FormulaBox label={t('exteriorLabel')} formula="360°" value={`${exteriorSum}°`} />

          <button
            type="button"
            disabled={playing}
            onClick={play}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {playing ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {playing ? tc('deriving') : t('playDerive')}
          </button>
          {progress > 0 ? (
            <button
              type="button"
              onClick={restore}
              className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" />
              {tc('restore')}
            </button>
          ) : null}

          <Hint>
            <span className="block font-semibold">{t('hintTitle')}</span>
            <span className="mt-1 block">{t('hintInterior')}</span>
            <span className="block">{t('hintExterior')}</span>
          </Hint>
        </div>
      }
    >
      <svg viewBox="0 0 720 360" className="w-full">
        <polygon
          points={polygon.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="#dbeafe66"
          stroke="#2563eb"
          strokeWidth="3"
        />

        {/* 从顶点0出发的对角线：用于分三角形 */}
        {Array.from({ length: visibleLines }, (_, idx) => {
          const targetIndex = idx + 2
          return (
            <line
              key={targetIndex}
              x1={polygon[0].x}
              y1={polygon[0].y}
              x2={polygon[targetIndex].x}
              y2={polygon[targetIndex].y}
              stroke="#7c3aed"
              strokeWidth="2.5"
              strokeDasharray="5 4"
            />
          )
        })}

        {/* 外角方向箭头（沿多边形同向行走） */}
        {polygon.map((p, idx) => {
          const next = polygon[(idx + 1) % polygon.length]
          const dx = next.x - p.x
          const dy = next.y - p.y
          const len = Math.hypot(dx, dy) || 1
          const ux = dx / len
          const uy = dy / len
          const ex = p.x + ux * 24
          const ey = p.y + uy * 24
          return (
            <line
              key={`ext-${idx}`}
              x1={p.x}
              y1={p.y}
              x2={ex}
              y2={ey}
              stroke="#f97316"
              strokeWidth="2"
              opacity={showFinal ? 0.9 : 0.35}
            />
          )
        })}

        {/* 外角辅助线：每个顶点延长一边，形成外角 */}
        {showExteriorGuides
          ? polygon.map((p, idx) => {
              const prev = polygon[(idx - 1 + polygon.length) % polygon.length]
              const vx = p.x - prev.x
              const vy = p.y - prev.y
              const len = Math.hypot(vx, vy) || 1
              const ux = vx / len
              const uy = vy / len
              const ex = p.x + ux * 26
              const ey = p.y + uy * 26
              return (
                <line
                  key={`ext-line-${idx}`}
                  x1={p.x}
                  y1={p.y}
                  x2={ex}
                  y2={ey}
                  stroke="#f97316"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  opacity={0.9}
                />
              )
            })
          : null}

        {progress > 0 ? (
          <>
            <text x={470} y={95} fill="#334155" fontSize="15" fontWeight="700">
              {t('nGon', { n: mode })}
            </text>
            <text x={470} y={128} fill="#7c3aed" fontSize="14" fontWeight="700">
              {t('triangleSplit', { count: triangleCount })}
            </text>
            <text x={470} y={158} fill="#334155" fontSize="14">
              {t('interiorEq', { count: triangleCount, sum: interiorSum })}
            </text>
            <text x={470} y={188} fill="#f97316" fontSize="14">
              {t('exteriorEq')}
            </text>
            {showExteriorGuides ? (
              <text x={470} y={215} fill="#f97316" fontSize="13">
                {t('exteriorGuide')}
              </text>
            ) : null}
            {showExteriorGuides ? (
              <text x={470} y={236} fill="#f97316" fontSize="13">
                {t('exteriorSumGuide')}
              </text>
            ) : null}
          </>
        ) : null}

        {showFinal ? (
          <text x={360} y={335} textAnchor="middle" fill="#334155" fontSize="16" fontWeight="700">
            {t('finalResult', { n: mode, interior: interiorSum })}
          </text>
        ) : (
          <text x={360} y={335} textAnchor="middle" fill="#64748b" fontSize="14">
            {t('playHint', { n: mode })}
          </text>
        )}
      </svg>
    </TopicPanel>
  )
}
