'use client'

import { FormulaBox, Hint, NumberControl, TopicPanel } from '../TopicUi'
import { useTranslations } from 'next-intl'
import { PointerEvent, useState } from 'react'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const polarPoint = (cx: number, cy: number, radius: number, degrees: number) => {
  const radians = ((degrees - 90) * Math.PI) / 180
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) }
}

export default function SectorAreaTopic() {
  const t = useTranslations('PageMathMotion.sectorArea')
  const [radius, setRadius] = useState(5)
  const [angle, setAngle] = useState(120)
  const [dragging, setDragging] = useState(false)
  const centerX = 360
  const centerY = 178
  const radiusPx = radius * 22
  const end = polarPoint(centerX, centerY, radiusPx, angle)
  const sectorPath = `M ${centerX} ${centerY} L ${centerX} ${centerY - radiusPx} A ${radiusPx} ${radiusPx} 0 ${
    angle > 180 ? 1 : 0
  } 1 ${end.x} ${end.y} Z`
  const area = (angle / 360) * Math.PI * radius * radius

  const updateAngleFromPointer = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragging) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 720
    const y = ((event.clientY - rect.top) / rect.height) * 360
    let degrees = (Math.atan2(y - centerY, x - centerX) * 180) / Math.PI + 90
    if (degrees < 0) degrees += 360
    setAngle(Math.round(clamp(degrees, 15, 345)))
  }

  return (
    <TopicPanel
      title={t('title')}
      subtitle={t('subtitle')}
      controls={
        <div className="space-y-5">
          <NumberControl
            id="sector-angle"
            label={t('centralAngle')}
            value={angle}
            min={15}
            max={345}
            step={1}
            unit="°"
            onChange={setAngle}
          />
          <NumberControl
            id="sector-radius"
            label={t('radius')}
            value={radius}
            min={2}
            max={6}
            step={0.1}
            unit={t('unit')}
            onChange={setRadius}
          />
          <FormulaBox label={t('proportion')} formula="θ / 360°" value={`${(angle / 360).toFixed(3)}`} />
          <FormulaBox label={t('sectorArea')} formula="S = θ/360° × πr²" value={area.toFixed(2)} />
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
        <g className="scale-[1.2] sm:scale-100" style={{ transformOrigin: `${centerX}px ${centerY}px` }}>
          <circle
            cx={centerX}
            cy={centerY}
            r={radiusPx}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.12"
            strokeWidth="2"
          />
          <path d={sectorPath} fill="#6366f1" fillOpacity="0.28" stroke="#6366f1" strokeWidth="3" />
          <path
            d={`M ${centerX} ${centerY - 40} A 40 40 0 ${angle > 180 ? 1 : 0} 1 ${polarPoint(centerX, centerY, 40, angle).x} ${
              polarPoint(centerX, centerY, 40, angle).y
            }`}
            fill="none"
            stroke="#f97316"
            strokeWidth="3"
          />
          <text x={centerX + 8} y={centerY - 54} fill="#f97316" fontSize="15" fontWeight="700">
            θ = {angle}°
          </text>
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
        </g>
        <text x={centerX} y="340" textAnchor="middle" fill="currentColor" opacity="0.6" fontSize="13">
          {t('dragInstruction')}
        </text>
      </svg>
    </TopicPanel>
  )
}
