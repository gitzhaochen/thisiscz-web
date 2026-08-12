'use client'

import { FormulaBox, Hint, NumberControl, TopicPanel } from '../TopicUi'
import { Play, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Mode = 'perimeter' | 'area'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

export default function SquareFormulaTopic() {
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

  const cx = 360
  const cy = 175
  const maxSize = 150
  const size = maxSize
  const left = cx - size / 2
  const top = cy - size / 2
  const filledCells = Math.floor(unitCount * unitCount * progress)

  return (
    <TopicPanel
      title="正方形的周长和面积"
      subtitle="正方形四边相等，周长是四条边之和，面积等于边长乘边长。"
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
              周长
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
              面积
            </button>
          </div>

          <NumberControl id="square-side" label="边长 a" value={side} min={2} max={8} step={1} unit="cm" onChange={setSide} />

          {mode === 'perimeter' ? (
            <>
              <FormulaBox label="周长" formula="P = 4a" value={`${perimeter} cm`} />
              <Hint>
                <span className="block font-semibold">推导</span>
                <span className="mt-1 block">正方形四条边都相等，每条边长为 a。</span>
                <span className="block">周长 = a + a + a + a = 4a。</span>
              </Hint>
            </>
          ) : (
            <>
              <FormulaBox label="面积" formula="S = a × a = a²" value={`${area} cm²`} />
              <button
                type="button"
                disabled={playing}
                onClick={playArea}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                {playing ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {playing ? '填充中...' : '播放面积动画'}
              </button>
              {progress > 0 ? (
                <button
                  type="button"
                  onClick={restore}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
                >
                  <RotateCcw className="h-4 w-4" />
                  还原
                </button>
              ) : null}
              <Hint>
                <span className="block font-semibold">推导</span>
                <span className="mt-1 block">把正方形分成边长为 1 的小正方形，每行 a 个，共 a 行。</span>
                <span className="block">小正方形总数 = a × a，所以 S = a²。</span>
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
              {unitCount} × {unitCount} = {area} 个小正方形 → S = a² = {area} cm²
            </text>
          ) : (
            <text x={cx} y={top + size + 28} textAnchor="middle" fill="#64748b" fontSize="14">
              {progress > 0 ? '正在逐格填充……' : '点击播放，观察 a×a 个单位正方形如何铺满'}
            </text>
          )}
        </svg>
      )}
    </TopicPanel>
  )
}
