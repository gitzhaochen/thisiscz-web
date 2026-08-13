'use client'

import { FormulaBox, Hint, NumberControl, TopicPanel } from '../TopicUi'
import { Play, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

type Mode = 'perimeter' | 'area'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const lerp = (from: number, to: number, t: number) => from + (to - from) * t
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

export default function TriangleAreaPerimeterTopic() {
  const t = useTranslations('PageMathMotion.triangleAreaPerimeter')
  const tc = useTranslations('PageMathMotion.common')
  const [mode, setMode] = useState<Mode>('area')
  const [sideA, setSideA] = useState(5)
  const [sideB, setSideB] = useState(6)
  const [sideC, setSideC] = useState(7)
  const [base, setBase] = useState(8)
  const [height, setHeight] = useState(5)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)

  const perimeter = sideA + sideB + sideC
  const area = (base * height) / 2
  const parallelogramArea = base * height

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
    const duration = 2000

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

  // 面积推导动画：两个全等三角形绕底边中点旋转拼成平行四边形
  const triBase = 220
  const triHeight = 110
  const leftX = 250
  const midY = 190
  const topY = midY - triHeight
  const bottomY = midY + triHeight
  const rightX = leftX + triBase
  const midX = leftX + triBase / 2
  const t2ApexY = lerp(topY, bottomY, progress)

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
                setMode('area')
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                mode === 'area' ? 'bg-indigo-600 text-white' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {t('tabArea')}
            </button>
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
              {t('tabPerimeter')}
            </button>
          </div>

          {mode === 'area' ? (
            <>
              <NumberControl id="tri-base" label={t('base')} value={base} min={3} max={12} step={0.5} unit="cm" onChange={setBase} />
              <NumberControl id="tri-height" label={t('height')} value={height} min={2} max={10} step={0.5} unit="cm" onChange={setHeight} />
              <FormulaBox label={t('triangleArea')} formula="S = a × h ÷ 2" value={`${area.toFixed(1)} cm²`} />
              <FormulaBox label={t('parallelogramArea')} formula="S = a × h" value={`${parallelogramArea.toFixed(1)} cm²`} />
              <button
                type="button"
                disabled={playing}
                onClick={playArea}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                {playing ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {playing ? t('assembling') : t('playAssemble')}
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
                <span className="block font-semibold">{t('heightTitle')}</span>
                <span className="mt-1 block">{t('heightBody')}</span>
                <span className="mt-2 block font-semibold">{t('areaMethodTitle')}</span>
                <span className="mt-1 block">{t('areaMethodBody')}</span>
              </Hint>
            </>
          ) : (
            <>
              <NumberControl id="tri-side-a" label={t('sideA')} value={sideA} min={2} max={12} step={0.5} unit="cm" onChange={setSideA} />
              <NumberControl id="tri-side-b" label={t('sideB')} value={sideB} min={2} max={12} step={0.5} unit="cm" onChange={setSideB} />
              <NumberControl id="tri-side-c" label={t('sideC')} value={sideC} min={2} max={12} step={0.5} unit="cm" onChange={setSideC} />
              <FormulaBox label={t('perimeter')} formula="P = a + b + c" value={`${perimeter.toFixed(1)} cm`} />
              <Hint>
                <span className="block font-semibold">{t('perimeterMeaningTitle')}</span>
                <span className="mt-1 block">{t('perimeterMeaningBody')}</span>
                <span className="mt-2 block font-semibold">{t('noteTitle')}</span>
                <span className="mt-1 block">{t('noteBody')}</span>
              </Hint>
            </>
          )}
        </div>
      }
    >
      {mode === 'area' ? (
        <svg viewBox="0 0 720 360" className="w-full">
          {/* 上三角形 */}
          <polygon
            points={`${leftX},${midY} ${rightX},${midY} ${midX},${topY}`}
            fill="#a5b4fc88"
            stroke="#6366f1"
            strokeWidth="2.5"
          />
          {/* 下三角形（旋转拼合） */}
          <polygon
            points={`${leftX},${midY} ${rightX},${midY} ${midX},${t2ApexY}`}
            fill="#fde68a88"
            stroke="#d97706"
            strokeWidth="2.5"
            opacity={lerp(0.4, 1, progress)}
          />

          <line x1={midX} y1={topY} x2={midX} y2={bottomY} stroke="#f97316" strokeDasharray="5 4" strokeWidth="2" />
          <text x={midX + 8} y={(topY + bottomY) / 2} fill="#f97316" fontSize="14" fontWeight="700">
            h
          </text>
          <text x={midX} y={midY + 16} textAnchor="middle" fill="#6366f1" fontSize="14" fontWeight="600">
            {t('baseLabel')}
          </text>

          {progress > 0.75 ? (
            <>
              <rect
                x={leftX}
                y={topY}
                width={triBase}
                height={triHeight * 2}
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <text x={midX} y={topY - 12} textAnchor="middle" fill="#64748b" fontSize="14" fontWeight="700">
                {t('parallelogramAreaText')}
              </text>
              <text x={midX} y={bottomY + 36} textAnchor="middle" fill="#334155" fontSize="15" fontWeight="700">
                {t('triangleAreaText')}
              </text>
            </>
          ) : (
            <text x={360} y={bottomY + 36} textAnchor="middle" fill="#64748b" fontSize="14">
              {progress > 0 ? t('assemblingHint') : t('playHint')}
            </text>
          )}
        </svg>
      ) : (
        <svg viewBox="0 0 720 360" className="w-full">
          <polygon points="220,250 500,250 360,100" fill="#dbeafe" stroke="#2563eb" strokeWidth="3" />
          <text x="208" y="272" fill="#2563eb" fontSize="16" fontWeight="700">
            B
          </text>
          <text x="508" y="272" fill="#2563eb" fontSize="16" fontWeight="700">
            C
          </text>
          <text x="360" y="88" fill="#2563eb" fontSize="16" fontWeight="700" textAnchor="middle">
            A
          </text>
          <text x="278" y="238" fill="#d97706" fontSize="15" fontWeight="700">
            c = {sideC}
          </text>
          <text x="418" y="238" fill="#d97706" fontSize="15" fontWeight="700">
            a = {sideA}
          </text>
          <text x="288" y="168" fill="#d97706" fontSize="15" fontWeight="700">
            b = {sideB}
          </text>
          <text x="360" y="310" textAnchor="middle" fill="#334155" fontSize="17" fontWeight="700">
            P = a + b + c = {sideA} + {sideB} + {sideC} = {perimeter.toFixed(1)} cm
          </text>
          {sideA + sideB <= sideC || sideA + sideC <= sideB || sideB + sideC <= sideA ? (
            <text x="360" y="336" textAnchor="middle" fill="#dc2626" fontSize="13" fontWeight="600">
              {t('invalidTriangle')}
            </text>
          ) : null}
        </svg>
      )}
    </TopicPanel>
  )
}
