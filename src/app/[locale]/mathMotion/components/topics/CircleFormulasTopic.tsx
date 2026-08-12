'use client'

import { FormulaBox, Hint, NumberControl, TopicPanel } from '../TopicUi'
import { MoveHorizontal, Play, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PointerEvent, useEffect, useRef, useState } from 'react'

const SECTOR_COUNT = 16
const SECTOR_ANGLE = (Math.PI * 2) / SECTOR_COUNT
const BLUE = '#9ec9ea'
const YELLOW = '#f0e29a'
const STROKE = '#9aa3ad'

type Mode = 'idle' | 'circumference' | 'area'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const lerp = (from: number, to: number, t: number) => from + (to - from) * t
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

const polar = (cx: number, cy: number, radius: number, angle: number) => ({
  x: cx + radius * Math.cos(angle),
  y: cy + radius * Math.sin(angle),
})

/** 尖在原点的扇形；angles 为数学角（0 右、逆时针） */
const wedgePath = (radius: number, startAngle: number, endAngle: number) => {
  const start = polar(0, 0, radius, startAngle)
  const end = polar(0, 0, radius, endAngle)
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
  return `M 0 0 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`
}

/** 完整扇形：弧朝 +y（向下） */
const fullWedgeDown = (radius: number) =>
  wedgePath(radius, Math.PI / 2 - SECTOR_ANGLE / 2, Math.PI / 2 + SECTOR_ANGLE / 2)

/** 让局部 +y 指向数学角时的 SVG rotate */
const svgRotAlignPlusY = (mathAngle: number) => ((Math.PI / 2 - mathAngle) * 180) / Math.PI

const shortestRotLerp = (from: number, to: number, t: number) => {
  let delta = to - from
  while (delta > 180) delta -= 360
  while (delta < -180) delta += 360
  return from + delta * t
}

const pieceLocalProgress = (globalProgress: number, index: number, count: number) => {
  const stagger = 0.58
  const start = (index / Math.max(count - 1, 1)) * stagger
  const duration = 1 - stagger
  return easeInOut(clamp((globalProgress - start) / duration, 0, 1))
}

type AreaPiece = {
  id: string
  fill: string
  /** 来自圆上第几个扇形（用于起点朝向） */
  fromIndex: number
  endTipX: number
  endTipY: number
  /** 终点时局部 +y 应指向的数学角 */
  endHeading: number
  /** 终点扇形张角：full | leftHalf | rightHalf（相对局部 +y） */
  endShape: 'full' | 'leftHalf' | 'rightHalf'
}

export default function CircleFormulasTopic() {
  const t = useTranslations('PageMathMotion.circleFormulas')
  const [radius, setRadius] = useState(4)
  const [mode, setMode] = useState<Mode>('idle')
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)

  const progressRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  const radiusPx = radius * 22
  const circumference = 2 * Math.PI * radius
  const area = Math.PI * radius * radius

  const idleCx = 360
  const idleCy = 160

  // 周长：圆滚动拉直
  const rollR = Math.min(radiusPx, 78)
  const rollTravel = 2 * Math.PI * rollR
  const rollStartX = 70 + rollR
  const groundY = 300
  const rollCx = rollStartX + progress * rollTravel
  const rollCy = groundY - rollR
  const rollRotation = progress * 360

  // 面积：扇形拼矩形
  const pieceR = Math.min(radiusPx, 105)
  const rectWidth = Math.PI * pieceR
  const rectLeft = (720 - rectWidth) / 2
  const rectTop = 318
  const cell = rectWidth / 8

  // 完整矩形拼法：8 蓝尖朝上 + 7 黄完整尖朝下 + 左右黄半扇
  // 圆上黄扇 index=15 拆成左右两个半扇
  const areaPieces: AreaPiece[] = [
    ...Array.from({ length: 8 }, (_, slot) => ({
      id: `blue-${slot}`,
      fill: BLUE,
      fromIndex: slot * 2,
      endTipX: rectLeft + (slot + 0.5) * cell,
      endTipY: rectTop,
      endHeading: Math.PI / 2,
      endShape: 'full' as const,
    })),
    ...Array.from({ length: 7 }, (_, slot) => ({
      id: `yellow-full-${slot}`,
      fill: YELLOW,
      fromIndex: slot * 2 + 1, // 1,3,5,7,9,11,13
      endTipX: rectLeft + (slot + 1) * cell,
      endTipY: rectTop + pieceR,
      endHeading: -Math.PI / 2,
      endShape: 'full' as const,
    })),
    {
      id: 'yellow-half-left',
      fill: YELLOW,
      fromIndex: 15,
      endTipX: rectLeft,
      endTipY: rectTop + pieceR,
      endHeading: -Math.PI / 2,
      endShape: 'leftHalf',
    },
    {
      id: 'yellow-half-right',
      fill: YELLOW,
      fromIndex: 15,
      endTipX: rectLeft + rectWidth,
      endTipY: rectTop + pieceR,
      endHeading: -Math.PI / 2,
      endShape: 'rightHalf',
    },
  ]

  const wedgeForShape = (radius: number, shape: AreaPiece['endShape'], t: number) => {
    const fullStart = Math.PI / 2 - SECTOR_ANGLE / 2
    const fullEnd = Math.PI / 2 + SECTOR_ANGLE / 2
    if (shape === 'full' || t < 0.72) {
      return wedgePath(radius, fullStart, fullEnd)
    }
    // 终点旋转 180° 后：局部 -x → 屏幕右，局部 +x → 屏幕左
    // 左端半扇要填向矩形内部（屏幕右）→ 保留局部 -x（角度区间 [π/2, fullEnd]）
    // 右端半扇要填向矩形内部（屏幕左）→ 保留局部 +x（角度区间 [fullStart, π/2]）
    const morph = (t - 0.72) / 0.28
    if (shape === 'leftHalf') {
      const start = lerp(fullStart, Math.PI / 2, morph)
      return wedgePath(radius, start, fullEnd)
    }
    const end = lerp(fullEnd, Math.PI / 2, morph)
    return wedgePath(radius, fullStart, end)
  }

  const stopAnimation = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const animateProgress = (target: number, durationMs: number, onDone?: () => void) => {
    stopAnimation()
    const startValue = progressRef.current
    const startTime = performance.now()

    const tick = (now: number) => {
      const t = clamp((now - startTime) / durationMs, 0, 1)
      const next = lerp(startValue, target, easeInOut(t))
      progressRef.current = next
      setProgress(next)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
        onDone?.()
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => () => stopAnimation(), [])

  const playCircumference = () => {
    if (mode === 'circumference' && progress > 0.95) {
      animateProgress(0, 900, () => {
        setMode('idle')
        progressRef.current = 0
        setProgress(0)
      })
      return
    }
    stopAnimation()
    progressRef.current = 0
    setProgress(0)
    setMode('circumference')
    // 等 mode 切换后再开启动画，避免首帧仍停在 idle
    requestAnimationFrame(() => {
      progressRef.current = 0
      animateProgress(1, 2400)
    })
  }

  const playArea = () => {
    if (mode === 'area' && progress > 0.95) {
      animateProgress(0, 1300, () => {
        setMode('idle')
        progressRef.current = 0
        setProgress(0)
      })
      return
    }
    stopAnimation()
    progressRef.current = 0
    setProgress(0)
    setMode('area')
    requestAnimationFrame(() => {
      progressRef.current = 0
      animateProgress(1, 3000)
    })
  }

  const updateRadiusFromPointer = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragging || mode !== 'idle') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const svgX = ((event.clientX - bounds.left) / bounds.width) * 720
    const svgY = ((event.clientY - bounds.top) / bounds.height) * 520
    const dist = Math.hypot(svgX - idleCx, svgY - idleCy)
    setRadius(Number(clamp(dist / 22, 1, 6).toFixed(1)))
  }

  const animatedPieces = areaPieces.map((piece, index) => {
    const bisector = -Math.PI / 2 + (piece.fromIndex + 0.5) * SECTOR_ANGLE
    const startRot = svgRotAlignPlusY(bisector)
    const endRot = svgRotAlignPlusY(piece.endHeading)
    const localT = pieceLocalProgress(progress, index, areaPieces.length)

    return {
      ...piece,
      tipX: lerp(idleCx, piece.endTipX, localT),
      tipY: lerp(idleCy, piece.endTipY, localT),
      rot: shortestRotLerp(startRot, endRot, localT),
      localT,
      pathD: wedgeForShape(pieceR, piece.endShape, localT),
    }
  })

  return (
    <TopicPanel
      title={t('title')}
      subtitle={t('subtitle')}
      controls={
        <div className="space-y-5">
          <NumberControl
            id="circle-radius"
            label={t('radius')}
            value={radius}
            min={1}
            max={6}
            step={0.1}
            unit={t('unit')}
            onChange={(value) => {
              if (mode === 'idle') setRadius(value)
            }}
          />
          <button
            type="button"
            onClick={playCircumference}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            {mode === 'circumference' && progress > 0.95 ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {mode === 'circumference' && progress > 0.95 ? t('restore') : t('unfold')}
          </button>
          <button
            type="button"
            onClick={playArea}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-700"
          >
            {mode === 'area' && progress > 0.95 ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {mode === 'area' && progress > 0.95 ? t('restoreArea') : t('unfoldArea')}
          </button>
          <FormulaBox label={t('circumference')} formula="C = 2πr" value={circumference.toFixed(2)} />
          <FormulaBox label={t('area')} formula="S = πr²" value={area.toFixed(2)} />
          <Hint>{t('hint')}</Hint>
        </div>
      }
    >
      <svg
        viewBox="0 0 720 520"
        role="img"
        aria-label={t('diagramLabel')}
        className="min-h-[300px] w-full touch-none select-none sm:min-h-[420px]"
        onPointerMove={updateRadiusFromPointer}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
      >
        <defs>
          <marker id="circle-arrow" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#4b5563" />
          </marker>
        </defs>

        {mode === 'idle' ? (
          <g className="origin-center scale-[1.5] sm:scale-100">
            {Array.from({ length: SECTOR_COUNT }, (_, index) => {
              const bisector = -Math.PI / 2 + (index + 0.5) * SECTOR_ANGLE
              return (
                <path
                  key={index}
                  d={fullWedgeDown(radiusPx)}
                  fill={index % 2 === 0 ? BLUE : YELLOW}
                  stroke={STROKE}
                  strokeWidth="1"
                  transform={`translate(${idleCx} ${idleCy}) rotate(${svgRotAlignPlusY(bisector)})`}
                />
              )
            })}
            <line x1={idleCx} y1={idleCy} x2={idleCx + radiusPx} y2={idleCy} stroke="#f97316" strokeWidth="3" />
            <text
              x={idleCx + radiusPx / 2}
              y={idleCy - 12}
              textAnchor="middle"
              fill="#f97316"
              fontSize="15"
              fontWeight="700"
            >
              r = {radius}
            </text>
            <circle
              cx={idleCx + radiusPx}
              cy={idleCy}
              r="10"
              fill="#f97316"
              stroke="white"
              strokeWidth="3"
              className="cursor-ew-resize"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                setDragging(true)
              }}
            />
            <g transform="translate(48 470)">
              <MoveHorizontal x="0" y="-15" width="18" height="18" color="#f97316" />
              <text x="27" y="0" fill="currentColor" opacity="0.65" fontSize="13">
                {t('dragInstruction')}
              </text>
            </g>
          </g>
        ) : null}

        {mode === 'circumference' ? (
          <g>
            <text x="360" y="56" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="600">
              {t('circumferenceUnfolded')}
            </text>

            <line
              x1={rollStartX}
              y1={groundY}
              x2={rollStartX + rollTravel}
              y2={groundY}
              stroke="#d1d5db"
              strokeWidth="2"
            />
            <line
              x1={rollStartX}
              y1={groundY}
              x2={rollStartX + progress * rollTravel}
              y2={groundY}
              stroke="#6366f1"
              strokeWidth="8"
              strokeLinecap="round"
            />

            <g transform={`translate(${rollCx} ${rollCy}) rotate(${rollRotation})`}>
              {Array.from({ length: SECTOR_COUNT }, (_, index) => {
                const bisector = -Math.PI / 2 + (index + 0.5) * SECTOR_ANGLE
                return (
                  <path
                    key={index}
                    d={fullWedgeDown(rollR)}
                    fill={index % 2 === 0 ? BLUE : YELLOW}
                    stroke={STROKE}
                    strokeWidth="1"
                    transform={`rotate(${svgRotAlignPlusY(bisector)})`}
                  />
                )
              })}
              <line x1="0" y1="0" x2={rollR} y2="0" stroke="#f97316" strokeWidth="3" />
              <circle cx={rollR} cy="0" r="5" fill="#f97316" />
            </g>

            <circle cx={rollCx} cy={groundY} r="4" fill="#6366f1" />

            <g opacity={progress > 0.86 ? 1 : 0}>
              <line
                x1={rollStartX}
                y1={groundY + 36}
                x2={rollStartX + rollTravel}
                y2={groundY + 36}
                stroke="#6366f1"
                strokeWidth="1.5"
                markerStart="url(#circle-arrow)"
                markerEnd="url(#circle-arrow)"
              />
              <text
                x={rollStartX + rollTravel / 2}
                y={groundY + 62}
                textAnchor="middle"
                fill="#6366f1"
                fontSize="16"
                fontWeight="700"
              >
                C = 2πr
              </text>
            </g>
          </g>
        ) : null}

        {mode === 'area' ? (
          <g>
            <text x="360" y="44" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="600">
              {t('areaUnfolded')}
            </text>

            <circle
              cx={idleCx}
              cy={idleCy}
              r={pieceR}
              fill="none"
              stroke={STROKE}
              strokeDasharray="5 5"
              strokeOpacity={Math.max(0, 0.4 * (1 - progress * 1.2))}
            />

            {animatedPieces.map((piece) => (
              <g key={piece.id} transform={`translate(${piece.tipX} ${piece.tipY}) rotate(${piece.rot})`}>
                <path d={piece.pathD} fill={piece.fill} stroke={STROKE} strokeWidth="1" />
              </g>
            ))}

            <g opacity={progress > 0.9 ? 1 : 0}>
              <line
                x1={rectLeft - 28}
                y1={rectTop}
                x2={rectLeft - 28}
                y2={rectTop + pieceR}
                stroke="#4b5563"
                strokeWidth="1.5"
                markerStart="url(#circle-arrow)"
                markerEnd="url(#circle-arrow)"
              />
              <text
                x={rectLeft - 44}
                y={rectTop + pieceR / 2 + 5}
                textAnchor="middle"
                fill="#4b5563"
                fontSize="18"
                fontWeight="700"
              >
                r
              </text>
              <line
                x1={rectLeft}
                y1={rectTop + pieceR + 28}
                x2={rectLeft + rectWidth}
                y2={rectTop + pieceR + 28}
                stroke="#4b5563"
                strokeWidth="1.5"
                markerStart="url(#circle-arrow)"
                markerEnd="url(#circle-arrow)"
              />
              <text
                x={rectLeft + rectWidth / 2}
                y={rectTop + pieceR + 52}
                textAnchor="middle"
                fill="#4b5563"
                fontSize="16"
                fontWeight="700"
              >
                πr
              </text>
              <text
                x={rectLeft + rectWidth / 2}
                y={rectTop + pieceR + 78}
                textAnchor="middle"
                fill="currentColor"
                fontSize="14"
                fontWeight="600"
                opacity="0.75"
              >
                S = πr × r = πr²
              </text>
            </g>
          </g>
        ) : null}
      </svg>
    </TopicPanel>
  )
}
