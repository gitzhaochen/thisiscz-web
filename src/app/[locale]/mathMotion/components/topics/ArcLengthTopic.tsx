'use client'

import { FormulaBox, Hint, NumberControl, TopicPanel } from '../TopicUi'
import { MoveHorizontal, Play, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PointerEvent, useState } from 'react'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const pointAt = (cx: number, cy: number, radius: number, degrees: number) => {
  const radians = ((degrees - 90) * Math.PI) / 180
  return { x: cx + Math.cos(radians) * radius, y: cy + Math.sin(radians) * radius }
}

export default function ArcLengthTopic() {
  const t = useTranslations('PageMathMotion.arcLength')
  const [radius, setRadius] = useState(4)
  const [angle, setAngle] = useState(90)
  const [straightened, setStraightened] = useState(false)
  const [dragging, setDragging] = useState(false)
  const radiusPx = radius * 23
  const end = pointAt(205, 180, radiusPx, angle)
  const arcPath = `M 205 ${180 - radiusPx} A ${radiusPx} ${radiusPx} 0 ${angle > 180 ? 1 : 0} 1 ${end.x} ${end.y}`
  const arcLength = (angle / 360) * 2 * Math.PI * radius
  const circumference = 2 * Math.PI * radius

  const updateAngleFromPointer = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragging) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 720
    const y = ((event.clientY - rect.top) / rect.height) * 360
    let degrees = (Math.atan2(y - 180, x - 205) * 180) / Math.PI + 90
    if (degrees < 0) degrees += 360
    setAngle(Math.round(clamp(degrees, 10, 350)))
  }

  return (
    <TopicPanel
      title={t('title')}
      subtitle={t('subtitle')}
      controls={
        <div className="space-y-5">
          <NumberControl
            id="arc-angle"
            label={t('centralAngle')}
            value={angle}
            min={10}
            max={350}
            unit="°"
            onChange={setAngle}
          />
          <NumberControl
            id="arc-radius"
            label={t('radius')}
            value={radius}
            min={2}
            max={6}
            step={0.1}
            unit={t('unit')}
            onChange={setRadius}
          />
          <button
            type="button"
            onClick={() => setStraightened((value) => !value)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            {straightened ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {straightened ? t('restore') : t('straighten')}
          </button>
          <FormulaBox label={t('fullCircumference')} formula="C = 2πr" value={circumference.toFixed(2)} />
          <FormulaBox label={t('arcLength')} formula="L = θ/360° × 2πr" value={arcLength.toFixed(2)} />
          <Hint>{t('hint')}</Hint>
        </div>
      }
    >
      <svg
        viewBox="0 0 720 360"
        role="img"
        aria-label={t('diagramLabel')}
        className="min-h-[320px] w-full touch-none select-none"
        onPointerMove={updateAngleFromPointer}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
      >
        <g opacity={straightened ? 0.35 : 1} className="transition-opacity duration-500">
          <circle
            cx="205"
            cy="180"
            r={radiusPx}
            fill="#6366f1"
            fillOpacity="0.08"
            stroke="currentColor"
            strokeOpacity="0.18"
          />
          <line x1="205" y1="180" x2="205" y2={180 - radiusPx} stroke="#6366f1" strokeWidth="2" />
          <line x1="205" y1="180" x2={end.x} y2={end.y} stroke="#6366f1" strokeWidth="2" />
          <path d={arcPath} fill="none" stroke="#f97316" strokeWidth="9" strokeLinecap="round" />
          <circle
            cx={end.x}
            cy={end.y}
            r="10"
            fill="#f97316"
            stroke="white"
            strokeWidth="3"
            className="cursor-grab active:cursor-grabbing"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              setDragging(true)
            }}
          />
          <path
            d={`M 205 140 A 40 40 0 ${angle > 180 ? 1 : 0} 1 ${pointAt(205, 180, 40, angle).x} ${
              pointAt(205, 180, 40, angle).y
            }`}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="3"
          />
          <text x="214" y="126" fill="#0891b2" fontSize="14" fontWeight="700">
            {angle}°
          </text>
        </g>

        <g
          opacity={straightened ? 1 : 0}
          transform={`translate(${straightened ? 0 : 35} 0)`}
          className="transition-all duration-700"
        >
          <text x="415" y="105" fill="currentColor" fontSize="14" fontWeight="600">
            {t('straightenedArc')}
          </text>
          <line
            x1="415"
            y1="155"
            x2={415 + Math.min(arcLength * 12, 245)}
            y2="155"
            stroke="#f97316"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <line x1="415" y1="187" x2={415 + Math.min(arcLength * 12, 245)} y2="187" stroke="#6366f1" strokeWidth="2" />
          <text x="530" y="215" textAnchor="middle" fill="#6366f1" fontSize="15" fontWeight="700">
            L = {arcLength.toFixed(2)}
          </text>
          <text x="530" y="246" textAnchor="middle" fill="currentColor" opacity="0.65" fontSize="13">
            {angle}° / 360° × 2πr
          </text>
        </g>

        <g transform="translate(74 334)">
          <MoveHorizontal x="0" y="-15" width="18" height="18" color="#f97316" />
          <text x="27" y="0" fill="currentColor" opacity="0.65" fontSize="13">
            {t('dragInstruction')}
          </text>
        </g>
      </svg>
    </TopicPanel>
  )
}
