'use client'

import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

const CLOCK_TOTAL_MINUTES = 12 * 60
const STEP_MINUTES = 5
const CENTER = 100
const RADIUS = 88

type HandType = 'hour' | 'minute'

function normalizeMinutes(minutes: number) {
  const value = minutes % CLOCK_TOTAL_MINUTES
  return value < 0 ? value + CLOCK_TOTAL_MINUTES : value
}

function circularDistance(a: number, b: number, modulo: number) {
  const diff = Math.abs(a - b) % modulo
  return Math.min(diff, modulo - diff)
}

function toPoint(angle: number, length: number) {
  const radian = ((angle - 90) * Math.PI) / 180
  return {
    x: CENTER + Math.cos(radian) * length,
    y: CENTER + Math.sin(radian) * length,
  }
}

export default function ClockLearningPage() {
  const [totalMinutes, setTotalMinutes] = useState(9 * 60)
  const [activeHand, setActiveHand] = useState<HandType | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const minute = totalMinutes % 60
  const hour = Math.floor(totalMinutes / 60) % 12
  const displayHour = hour === 0 ? 12 : hour

  const minuteAngle = (minute / 60) * 360
  const hourAngle = (totalMinutes / CLOCK_TOTAL_MINUTES) * 360
  const minuteTip = toPoint(minuteAngle, 68)
  const hourTip = toPoint(hourAngle, 50)

  const timeText = `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  const getPointerAngle = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return null

    const rect = svg.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const dx = x - rect.width / 2
    const dy = y - rect.height / 2
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90
    if (angle < 0) angle += 360
    return angle
  }, [])

  const updateTimeFromHandAngle = useCallback(
    (hand: HandType, angle: number) => {
      setTotalMinutes((current) => {
        if (hand === 'minute') {
          const rawMinute = Math.round(angle / 6) % 60
          const snappedMinute = (Math.round(rawMinute / STEP_MINUTES) * STEP_MINUTES) % 60
          const currentHour = Math.floor(current / 60)
          const base = currentHour * 60 + snappedMinute
          const candidates = [base - 60, base, base + 60].map((item) => normalizeMinutes(item))

          return candidates.reduce((best, candidate) => {
            const bestDistance = circularDistance(best, current, CLOCK_TOTAL_MINUTES)
            const candidateDistance = circularDistance(candidate, current, CLOCK_TOTAL_MINUTES)
            return candidateDistance < bestDistance ? candidate : best
          }, candidates[0])
        }

        const rawMinutes = Math.round((angle / 360) * CLOCK_TOTAL_MINUTES)
        const snapped = Math.round(rawMinutes / STEP_MINUTES) * STEP_MINUTES
        return normalizeMinutes(snapped)
      })
    },
    [],
  )

  const onPointerDown = useCallback(
    (hand: HandType) => (event: ReactPointerEvent<SVGCircleElement>) => {
      event.preventDefault()
      setActiveHand(hand)
      const angle = getPointerAngle(event.clientX, event.clientY)
      if (angle !== null) updateTimeFromHandAngle(hand, angle)
    },
    [getPointerAngle, updateTimeFromHandAngle],
  )

  useEffect(() => {
    if (!activeHand) return

    const onMove = (event: PointerEvent) => {
      const angle = getPointerAngle(event.clientX, event.clientY)
      if (angle !== null) {
        updateTimeFromHandAngle(activeHand, angle)
      }
    }

    const onUp = () => setActiveHand(null)

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [activeHand, getPointerAngle, updateTimeFromHandAngle])

  const marks = useMemo(() => Array.from({ length: 12 }, (_, index) => index), [])

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-6 py-10 md:flex-row md:items-start md:justify-center">
      <svg
        ref={svgRef}
        viewBox="0 0 200 200"
        className="h-[320px] w-[320px] select-none rounded-full bg-white shadow-md touch-none"
      >
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="#fff" stroke="#111827" strokeWidth="2.5" />

        {marks.map((index) => {
          const angle = index * 30
          const isMajor = index % 3 === 0
          const outer = toPoint(angle, RADIUS - 1)
          const inner = toPoint(angle, isMajor ? RADIUS - 16 : RADIUS - 10)

          return (
            <line
              key={index}
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
              stroke="#1f2937"
              strokeWidth={isMajor ? 3 : 2}
              strokeLinecap="round"
            />
          )
        })}

        {marks.map((index) => {
          const angle = index * 30
          const labelPoint = toPoint(angle, RADIUS - 28)
          const label = index === 0 ? 12 : index

          return (
            <text
              key={`label-${index}`}
              x={labelPoint.x}
              y={labelPoint.y}
              fill="#111827"
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="middle"
              pointerEvents="none"
            >
              {label}
            </text>
          )
        })}

        <line x1={CENTER} y1={CENTER} x2={hourTip.x} y2={hourTip.y} stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
        <line
          x1={CENTER}
          y1={CENTER}
          x2={minuteTip.x}
          y2={minuteTip.y}
          stroke="#2563eb"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx={CENTER} cy={CENTER} r="5.5" fill="#111827" />

        <circle
          cx={hourTip.x}
          cy={hourTip.y}
          r="12"
          fill="transparent"
          className="cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown('hour')}
        />
        <circle
          cx={minuteTip.x}
          cy={minuteTip.y}
          r="12"
          fill="transparent"
          className="cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown('minute')}
        />
      </svg>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 text-slate-800 shadow-sm">
        <p className="text-sm text-slate-500">当前时间</p>
        <p className="mt-2 text-4xl font-bold tracking-wide text-slate-900">{timeText}</p>
        <p className="mt-2 text-lg">{displayHour} 点 {minute} 分</p>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          拖动蓝色分针或黑色时针来调时间。
          <br />
          表盘最小刻度是 5 分钟。
        </p>
      </div>
    </div>
  )
}
