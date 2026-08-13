'use client'

import { FormulaBox, Hint, NumberControl, TopicPanel } from '../TopicUi'
import { Play, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const lerp = (from: number, to: number, t: number) => from + (to - from) * t
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

export default function PythagoreanTheoremTopic() {
  const t = useTranslations('PageMathMotion.pythagoreanTheorem')
  const tc = useTranslations('PageMathMotion.common')
  const [a, setA] = useState(3)
  const [b, setB] = useState(4)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)

  const c = Math.sqrt(a * a + b * b)
  const areaA = a * a
  const areaB = b * b
  const areaC = c * c

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
    const duration = 2800

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

  const showSquares = progress > 0
  // 分阶段出现：a² → b² → c² → 结论
  const showA = progress > 0.08
  const showB = progress > 0.28
  const showC = progress > 0.48
  const showResult = progress > 0.78

  const opacityA = showA ? clamp((progress - 0.08) / 0.18, 0, 1) : 0
  const opacityB = showB ? clamp((progress - 0.28) / 0.18, 0, 1) : 0
  const opacityC = showC ? clamp((progress - 0.48) / 0.18, 0, 1) : 0

  // 初始只显示三角形时放大；播放后略缩小，给三边正方形留空间
  const idleScale = Math.min(180 / a, 240 / b)
  const playScale = Math.min(90 / a, 110 / b, 95 / c)
  const scale = lerp(idleScale, playScale, clamp(progress / 0.25, 0, 1))
  const aPx = a * scale
  const bPx = b * scale

  // 先以直角顶点为原点算局部坐标，再整体平移居中
  const localTop = { x: 0, y: -aPx }
  const localRight = { x: bPx, y: 0 }
  const hypOut = { x: aPx, y: -bPx }
  const localC2 = { x: localRight.x + hypOut.x, y: localRight.y + hypOut.y }
  const localC3 = { x: localTop.x + hypOut.x, y: localTop.y + hypOut.y }

  const localPoints = showSquares
    ? [
        { x: 0, y: 0 },
        localTop,
        localRight,
        { x: -aPx, y: -aPx },
        { x: 0, y: -aPx },
        { x: -aPx, y: 0 },
        { x: 0, y: bPx },
        { x: bPx, y: bPx },
        localC2,
        localC3,
      ]
    : [{ x: 0, y: 0 }, localTop, localRight]

  const minX = Math.min(...localPoints.map((p) => p.x))
  const maxX = Math.max(...localPoints.map((p) => p.x))
  const minY = Math.min(...localPoints.map((p) => p.y))
  const maxY = Math.max(...localPoints.map((p) => p.y))
  const offsetX = (720 - (maxX - minX)) / 2 - minX
  const offsetY = (320 - (maxY - minY)) / 2 - minY // 底部留公式空间

  const R = { x: offsetX, y: offsetY }
  const top = { x: offsetX + localTop.x, y: offsetY + localTop.y }
  const right = { x: offsetX + localRight.x, y: offsetY + localRight.y }

  const aSquare = { x: R.x - aPx, y: R.y - aPx, size: aPx }
  const bSquare = { x: R.x, y: R.y, size: bPx }

  const cP0 = top
  const cP1 = right
  const cP2 = { x: offsetX + localC2.x, y: offsetY + localC2.y }
  const cP3 = { x: offsetX + localC3.x, y: offsetY + localC3.y }
  const cLabel = {
    x: (cP0.x + cP1.x + cP2.x + cP3.x) / 4,
    y: (cP0.y + cP1.y + cP2.y + cP3.y) / 4,
  }

  return (
    <TopicPanel
      title={t('title')}
      subtitle={t('subtitle')}
      controls={
        <div className="space-y-4">
          <NumberControl id="pythagorean-a" label={t('legA')} value={a} min={1} max={12} step={1} onChange={setA} />
          <NumberControl id="pythagorean-b" label={t('legB')} value={b} min={1} max={12} step={1} onChange={setB} />
          <FormulaBox label={t('theoremLabel')} formula="a² + b² = c²" value={`${a}² + ${b}² = ${c.toFixed(2)}²`} />
          <FormulaBox label={t('areaRelation')} formula="S(a²) + S(b²) = S(c²)" value={`${areaA} + ${areaB} = ${areaC.toFixed(2)}`} />
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
            <span className="mt-1 block">{t('hintBody1')}</span>
            <span className="block">{t('hintBody2')}</span>
          </Hint>
        </div>
      }
    >
      <svg viewBox="0 0 720 360" className="w-full">
        {/* c² */}
        {showSquares && showC ? (
          <g opacity={opacityC}>
            <polygon
              points={`${cP0.x},${cP0.y} ${cP1.x},${cP1.y} ${cP2.x},${cP2.y} ${cP3.x},${cP3.y}`}
              fill="#c4b5fd88"
              stroke="#7c3aed"
              strokeWidth="2.5"
            />
            <text x={cLabel.x} y={cLabel.y + 5} textAnchor="middle" fill="#6d28d9" fontSize="16" fontWeight="700">
              c²
            </text>
          </g>
        ) : null}

        {/* a² */}
        {showSquares && showA ? (
          <g opacity={opacityA}>
            <rect
              x={aSquare.x}
              y={aSquare.y}
              width={aSquare.size}
              height={aSquare.size}
              fill="#86efac99"
              stroke="#16a34a"
              strokeWidth="2.5"
            />
            <text
              x={aSquare.x + aSquare.size / 2}
              y={aSquare.y + aSquare.size / 2 + 5}
              textAnchor="middle"
              fill="#166534"
              fontSize="15"
              fontWeight="700"
            >
              a²
            </text>
          </g>
        ) : null}

        {/* b² */}
        {showSquares && showB ? (
          <g opacity={opacityB}>
            <rect
              x={bSquare.x}
              y={bSquare.y}
              width={bSquare.size}
              height={bSquare.size}
              fill="#fcd34d88"
              stroke="#d97706"
              strokeWidth="2.5"
            />
            <text
              x={bSquare.x + bSquare.size / 2}
              y={bSquare.y + bSquare.size / 2 + 5}
              textAnchor="middle"
              fill="#b45309"
              fontSize="15"
              fontWeight="700"
            >
              b²
            </text>
          </g>
        ) : null}

        {/* 直角三角形始终显示 */}
        <polygon
          points={`${R.x},${R.y} ${top.x},${top.y} ${right.x},${right.y}`}
          fill="#dbeafeaa"
          stroke="#2563eb"
          strokeWidth="3"
        />
        <path
          d={`M ${R.x} ${R.y - 16} L ${R.x + 16} ${R.y - 16} L ${R.x + 16} ${R.y}`}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.5"
        />

        {/* 边标签放在三角形内侧，避免互相重叠 */}
        <text x={R.x + Math.min(18, aPx * 0.2)} y={R.y - aPx * 0.45} fill="#2563eb" fontSize="14" fontWeight="700">
          a
        </text>
        <text x={R.x + bPx * 0.45} y={R.y - 10} fill="#2563eb" fontSize="14" fontWeight="700">
          b
        </text>
        <text x={R.x + bPx * 0.42} y={R.y - aPx * 0.28} fill="#2563eb" fontSize="14" fontWeight="700">
          c
        </text>

        <text
          x={360}
          y={345}
          textAnchor="middle"
          fill={showResult ? '#334155' : '#64748b'}
          fontSize={showResult ? 16 : 14}
          fontWeight="700"
        >
          {showResult
            ? `a² + b² = c² → ${areaA} + ${areaB} = ${areaC.toFixed(2)}`
            : showSquares
              ? t('buildingSquares')
              : t('playHint')}
        </text>
      </svg>
    </TopicPanel>
  )
}
