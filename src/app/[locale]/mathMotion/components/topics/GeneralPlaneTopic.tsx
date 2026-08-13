'use client'

import { TopicAnimationType } from '../../mathMotionTopics'
import { FormulaBox, Hint, TopicPanel } from '../TopicUi'
import { Play, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

function renderTopicAnimation(type: TopicAnimationType, progress: number) {
  if (type === 'triangle-area') {
    const h = 150 - progress * 60
    return (
      <>
        <line x1="120" y1="220" x2="320" y2="220" stroke="#94a3b8" strokeWidth="2" />
        <polygon
          points={`120,220 320,220 250,${h}`}
          fill="#a5b4fc"
          fillOpacity="0.55"
          stroke="#6366f1"
          strokeWidth="2"
        />
        <line x1="250" y1={h} x2="250" y2="220" stroke="#f97316" strokeDasharray="5 4" strokeWidth="2" />
        <text x="252" y="186" fill="#f97316" fontSize="14">
          h
        </text>
      </>
    )
  }
  if (type === 'triangle-angle-sum') {
    const lift = 120 * progress
    return (
      <>
        <polygon points="120,230 300,230 250,120" fill="#93c5fd55" stroke="#3b82f6" strokeWidth="2" />
        <path d={`M 250 ${120 - lift} L 290 ${130 - lift}`} stroke="#f97316" strokeWidth="4" />
        <path d={`M 250 ${120 - lift} L 235 ${165 - lift}`} stroke="#22c55e" strokeWidth="4" />
        <path d={`M 250 ${120 - lift} L 210 ${130 - lift}`} stroke="#a855f7" strokeWidth="4" />
        <line x1="180" y1="84" x2="320" y2="84" stroke="#64748b" strokeWidth="2" strokeDasharray="6 4" />
      </>
    )
  }
  if (type === 'square-formula') {
    const side = 70 + progress * 80
    return (
      <>
        <rect
          x={220 - side / 2}
          y={170 - side / 2}
          width={side}
          height={side}
          fill="#a7f3d0aa"
          stroke="#10b981"
          strokeWidth="2"
        />
        <text x="220" y={170 + side / 2 + 20} textAnchor="middle" fill="#10b981" fontSize="14">
          a
        </text>
      </>
    )
  }
  if (type === 'rectangle-formula') {
    const w = 120 + progress * 80
    const h = 70 + progress * 30
    return (
      <>
        <rect x={220 - w / 2} y={170 - h / 2} width={w} height={h} fill="#bae6fd99" stroke="#0891b2" strokeWidth="2" />
        <text x="220" y={170 + h / 2 + 18} textAnchor="middle" fill="#0891b2" fontSize="14">
          l
        </text>
        <text x={220 + w / 2 + 14} y="172" fill="#0891b2" fontSize="14">
          w
        </text>
      </>
    )
  }
  if (type === 'parallelogram-area') {
    const slide = 65 * progress
    return (
      <>
        <polygon
          points={`120,220 280,220 ${340 - slide},120 ${180 - slide},120`}
          fill="#fde68a99"
          stroke="#d97706"
          strokeWidth="2"
        />
        <line x1="180" y1="120" x2="180" y2="220" stroke="#f97316" strokeDasharray="5 4" strokeWidth="2" />
      </>
    )
  }
  if (type === 'trapezoid-area') {
    const move = 160 * progress
    return (
      <>
        <polygon points="120,230 320,230 270,140 170,140" fill="#ddd6feaa" stroke="#7c3aed" strokeWidth="2" />
        <polygon
          points={`${120 + move},230 ${320 + move},230 ${270 + move},140 ${170 + move},140`}
          fill="#ddd6fe66"
          stroke="#7c3aed"
          strokeWidth="2"
        />
      </>
    )
  }
  return (
    <>
      <polygon points="220,90 310,140 286,230 154,230 130,140" fill="#bfdbfeaa" stroke="#2563eb" strokeWidth="2" />
      {Array.from({ length: 3 }, (_, idx) => (
        <line
          key={idx}
          x1="220"
          y1="90"
          x2={220 + Math.cos((idx / 3) * Math.PI) * (80 + progress * 20)}
          y2={90 + Math.sin((idx / 3) * Math.PI) * (120 + progress * 20)}
          stroke="#1d4ed8"
          strokeDasharray="5 4"
          strokeWidth="2"
        />
      ))}
    </>
  )
}

type Props = {
  translationKey: string
  animationType?: TopicAnimationType
}

export default function GeneralPlaneTopic({ translationKey, animationType }: Props) {
  const t = useTranslations(`PageMathMotion.${translationKey}`)
  const tc = useTranslations('PageMathMotion.common')
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const points = t.raw('points') as string[]
  const formulas = t.has('formulas') ? (t.raw('formulas') as string[]) : []
  const title = t('title')

  const play = () => {
    if (!animationType) return
    if (playing) return
    setPlaying(true)
    setProgress(0)
    const start = performance.now()
    const duration = 1800

    const tick = (now: number) => {
      const next = clamp((now - start) / duration, 0, 1)
      setProgress(easeOut(next))
      if (next < 1) {
        requestAnimationFrame(tick)
      } else {
        setPlaying(false)
      }
    }

    requestAnimationFrame(tick)
  }

  return (
    <TopicPanel
      title={title}
      subtitle={t('intro')}
      controls={
        <div className="space-y-4">
          {animationType ? (
            <button
              type="button"
              disabled={playing}
              onClick={play}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              {playing ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {playing ? tc('playing') : tc('play')}
            </button>
          ) : null}
          {formulas.map((formula) => (
            <FormulaBox key={formula} label={tc('formula')} formula={formula} value=" " />
          ))}
          <Hint>
            <span className="block">{tc('keyPoints')}</span>
            {points.map((point) => (
              <span key={point} className="mt-1 block">
                - {point}
              </span>
            ))}
          </Hint>
        </div>
      }
    >
      <svg viewBox="0 0 440 280" className="w-full">
        {animationType ? (
          renderTopicAnimation(animationType, progress)
        ) : (
          <>
            <rect x="80" y="70" width="280" height="140" rx="14" fill="#f1f5f9" stroke="#94a3b8" />
            <text x="220" y="130" textAnchor="middle" fill="#334155" fontSize="18" fontWeight="600">
              {title}
            </text>
            <text x="220" y="162" textAnchor="middle" fill="#64748b" fontSize="14">
              {tc('definitionExplain')}
            </text>
          </>
        )}
      </svg>
    </TopicPanel>
  )
}
