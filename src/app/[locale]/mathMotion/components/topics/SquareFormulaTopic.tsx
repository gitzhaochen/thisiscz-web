'use client'

import { FormulaBox, Hint, NumberControl, TopicPanel } from '../TopicUi'
import { Play, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

type Mode = 'perimeter' | 'area'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

export default function SquareFormulaTopic() {
  const t = useTranslations('PageMathMotion.squareFormula')
  const tc = useTranslations('PageMathMotion.common')
  const [mode, setMode] = useState<Mode>('area')
  const [side, setSide] = useState(5)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)

  const perimeter = 4 * side
  const area = side * side
  const unitCount = Math.round(side)

  const stopAnimation = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const playArea = () => {
    if (playing) return
    setPlaying(true)
    setProgress(0)
    const start = performance.now()
    const duration = 1800

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

  const cx = 360
  const cy = 175
  const maxSize = 150
  const size = maxSize
  const left = cx - size / 2
  const top = cy - size / 2
  const filledCells = Math.floor(unitCount * unitCount * progress)

  return (
    <TopicPanel
      title={t('title')}
      subtitle={t('subtitle')}
      controls={
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                restore()
                setMode('perimeter')
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                mode === 'perimeter' ? 'bg-indigo-600 text-white' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {t('perimeter')}
            </button>
            <button
              type="button"
              onClick={() => {
                restore()
                setMode('area')
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                mode === 'area' ? 'bg-indigo-600 text-white' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {t('area')}
            </button>
          </div>

          <NumberControl id="square-side" label={t('side')} value={side} min={2} max={8} step={1} unit="cm" onChange={setSide} />

          {mode === 'perimeter' ? (
            <>
              <FormulaBox label={t('perimeter')} formula="P = 4a" value={`${perimeter} cm`} />
              <Hint>
                <span className="block font-semibold">{tc('derivation')}</span>
                <span className="mt-1 block">{t('perimeterHint1')}</span>
                <span className="block">{t('perimeterHint2')}</span>
              </Hint>
            </>
          ) : (
            <>
              <FormulaBox label={t('area')} formula="S = a × a = a²" value={`${area} cm²`} />
              <button
                type="button"
                disabled={playing}
                onClick={playArea}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                {playing ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {playing ? t('filling') : t('playArea')}
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
                <span className="block font-semibold">{tc('derivation')}</span>
                <span className="mt-1 block">{t('areaHint1')}</span>
                <span className="block">{t('areaHint2')}</span>
              </Hint>
            </>
          )}
        </div>
      }
    >
      {mode === 'perimeter' ? (
        <svg viewBox="0 0 720 360" className="w-full">
          <rect x={left} y={top} width={size} height={size} fill="#bbf7d055" stroke="#16a34a" strokeWidth="3" />
          {/* 四边标注 */}
          <text x={cx} y={top - 10} textAnchor="middle" fill="#16a34a" fontSize="15" fontWeight="700">
            a
          </text>
          <text x={cx} y={top + size + 22} textAnchor="middle" fill="#16a34a" fontSize="15" fontWeight="700">
            a
          </text>
          <text x={left - 16} y={cy + 5} textAnchor="end" fill="#16a34a" fontSize="15" fontWeight="700">
            a
          </text>
          <text x={left + size + 16} y={cy + 5} textAnchor="start" fill="#16a34a" fontSize="15" fontWeight="700">
            a
          </text>
          <text x={cx} y={top + size + 52} textAnchor="middle" fill="#334155" fontSize="17" fontWeight="700">
            P = a + a + a + a = 4a = {perimeter} cm
          </text>
        </svg>
      ) : (
        <svg viewBox="0 0 720 360" className="w-full">
          <rect x={left} y={top} width={size} height={size} fill="#f8fafc" stroke="#16a34a" strokeWidth="3" />

          {/* 单位小正方形网格 */}
          {Array.from({ length: unitCount }, (_, row) =>
            Array.from({ length: unitCount }, (_, col) => {
              const cellW = size / unitCount
              const cellH = size / unitCount
              const idx = row * unitCount + col
              const filled = progress > 0 && idx < filledCells
              return (
                <rect
                  key={`${row}-${col}`}
                  x={left + col * cellW + 1}
                  y={top + row * cellH + 1}
                  width={cellW - 2}
                  height={cellH - 2}
                  fill={filled ? '#86efac' : '#f1f5f9'}
                  stroke="#16a34a"
                  strokeWidth="1"
                  opacity={filled ? 1 : 0.4}
                />
              )
            }),
          )}

          <text x={cx} y={top - 10} textAnchor="middle" fill="#16a34a" fontSize="15" fontWeight="700">
            a = {side}
          </text>

          {progress > 0.85 ? (
            <text x={cx} y={top + size + 28} textAnchor="middle" fill="#334155" fontSize="16" fontWeight="700">
              {t('areaResult', { count: unitCount, area })}
            </text>
          ) : (
            <text x={cx} y={top + size + 28} textAnchor="middle" fill="#64748b" fontSize="14">
              {progress > 0 ? t('fillingHint') : t('playHint')}
            </text>
          )}
        </svg>
      )}
    </TopicPanel>
  )
}
