'use client'

import { FormulaBox, Hint, NumberControl, TopicPanel } from '../TopicUi'
import { Play, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const lerp = (from: number, to: number, t: number) => from + (to - from) * t
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

/** 动画阶段：拼合 → 标 a+b → 乘高 → 对半分 */
type Phase = 'idle' | 'join' | 'addBase' | 'timesH' | 'halve' | 'done'

export default function TrapezoidAreaTopic() {
  const [topBase, setTopBase] = useState(6)
  const [bottomBase, setBottomBase] = useState(10)
  const [height, setHeight] = useState(5)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)

  const area = ((topBase + bottomBase) * height) / 2
  const paraArea = (topBase + bottomBase) * height

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
    const duration = 5200

    const tick = (now: number) => {
      const raw = clamp((now - start) / duration, 0, 1)
      setProgress(raw)
      if (raw < 1) {
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

  // 阶段划分
  const phase: Phase =
    progress === 0
      ? 'idle'
      : progress < 0.28
        ? 'join'
        : progress < 0.48
          ? 'addBase'
          : progress < 0.68
            ? 'timesH'
            : progress < 0.88
              ? 'halve'
              : 'done'

  const joinT = easeInOut(clamp(progress / 0.28, 0, 1))
  const joined = joinT >= 1
  const showSecondTrapezoid = progress > 0
  const showAddBase = phase === 'addBase' || phase === 'timesH' || phase === 'halve' || phase === 'done'
  const showHalve = phase === 'halve' || phase === 'done'
  const stageExpression =
    phase === 'idle'
      ? 'S = (a + b) × h ÷ 2'
      : phase === 'join'
        ? '先拼合：两个全等梯形 → 一个平行四边形'
        : phase === 'addBase'
          ? '底边 = a + b'
          : phase === 'timesH'
            ? `乘高：S平行四边形 = (a + b) × h = ${topBase + bottomBase} × ${height} = ${paraArea.toFixed(1)}`
            : phase === 'halve'
              ? `对半分：S梯形 = S平行四边形 ÷ 2 = ${paraArea.toFixed(1)} ÷ 2`
              : `S = (a + b) × h ÷ 2 = ${area.toFixed(1)} cm²`

  const bottomPx = 240
  const topPx = 140
  const heightPx = 105
  const leftInset = (bottomPx - topPx) / 2
  // 单个梯形居中；播放后平移，使拼成的平行四边形也居中
  const singleOriginX = (720 - bottomPx) / 2
  const joinedOriginX = (720 - (bottomPx + topPx)) / 2
  const originX = lerp(singleOriginX, joinedOriginX, joinT)
  const originY = 70

  const A = { x: originX, y: originY + heightPx }
  const B = { x: originX + bottomPx, y: originY + heightPx }
  const C = { x: originX + leftInset + topPx, y: originY }
  const D = { x: originX + leftInset, y: originY }

  // 第二个梯形保持全等：下底为 a（贴到右侧），上底为 b
  const endA2 = { x: B.x - leftInset, y: B.y - heightPx }
  const endB2 = { x: B.x + topPx + leftInset, y: B.y - heightPx }
  const endC2 = { x: B.x + topPx, y: B.y }
  const endD2 = { x: B.x, y: B.y }

  const startGap = 110
  const gap = startGap * (1 - joinT)
  const A2 = { x: endA2.x + gap, y: endA2.y }
  const B2 = { x: endB2.x + gap, y: endB2.y }
  const C2 = { x: endC2.x + gap, y: endC2.y }
  const D2 = { x: endD2.x + gap, y: endD2.y }

  return (
    <TopicPanel
      title="梯形的面积公式"
      subtitle="两个全等梯形拼成平行四边形，再对半分：S = (a + b) × h ÷ 2。"
      controls={
        <div className="space-y-4">
          <NumberControl
            id="trap-top"
            label="上底 a"
            value={topBase}
            min={2}
            max={12}
            step={0.5}
            unit="cm"
            onChange={setTopBase}
          />
          <NumberControl
            id="trap-bottom"
            label="下底 b"
            value={bottomBase}
            min={3}
            max={15}
            step={0.5}
            unit="cm"
            onChange={setBottomBase}
          />
          <NumberControl
            id="trap-height"
            label="高 h"
            value={height}
            min={2}
            max={10}
            step={0.5}
            unit="cm"
            onChange={setHeight}
          />
          <FormulaBox label="梯形面积" formula="S = (a + b) × h ÷ 2" value={`${area.toFixed(1)} cm²`} />
          <button
            type="button"
            disabled={playing}
            onClick={play}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {playing ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {playing ? '推导中...' : '播放公式推导'}
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
            <span className="block font-semibold">推导四步</span>
            <span className="mt-1 block">① 两个全等梯形拼成平行四边形</span>
            <span className="block">② 底边 = a + b</span>
            <span className="block">③ 平行四边形面积 = (a + b) × h</span>
            <span className="block">④ 梯形是一半 → ÷ 2</span>
          </Hint>
        </div>
      }
    >
      <svg viewBox="0 0 720 360" className="w-full">
        {/* 第一个梯形 */}
        <polygon
          points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}`}
          fill={showHalve ? '#c4b5fdcc' : '#ddd6fe88'}
          stroke="#7c3aed"
          strokeWidth="2.5"
        />

        {/* 第二个梯形（点击播放后出现） */}
        {showSecondTrapezoid ? (
          <polygon
            points={`${A2.x},${A2.y} ${B2.x},${B2.y} ${C2.x},${C2.y} ${D2.x},${D2.y}`}
            fill={showHalve ? '#fde68a55' : '#fde68a88'}
            stroke="#d97706"
            strokeWidth="2.5"
            opacity={lerp(0.5, 1, joinT)}
          />
        ) : null}

        {/* 对分线：拼合后的公共边（把平行四边形切成两个梯形） */}
        {joined ? (
          <line
            x1={B.x}
            y1={B.y}
            x2={endA2.x}
            y2={endA2.y}
            stroke="#ef4444"
            strokeWidth={showHalve ? 3.5 : 2}
            strokeDasharray={showHalve ? undefined : '6 4'}
          />
        ) : null}

        {/* 高 */}
        <line x1={D.x} y1={D.y} x2={D.x} y2={A.y} stroke="#f97316" strokeWidth="2.5" strokeDasharray="5 4" />
        <text x={D.x - 14} y={(D.y + A.y) / 2 + 4} textAnchor="end" fill="#f97316" fontSize="15" fontWeight="700">
          h
        </text>

        {/* 初始：标上底 a、下底 b */}
        {!joined ? (
          <>
            <line x1={D.x} y1={D.y} x2={C.x} y2={C.y} stroke="#16a34a" strokeWidth="4" />
            <text x={(D.x + C.x) / 2} y={D.y - 10} textAnchor="middle" fill="#16a34a" fontSize="14" fontWeight="700">
              上底 a
            </text>
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#2563eb" strokeWidth="4" />
            <text x={(A.x + B.x) / 2} y={A.y + 20} textAnchor="middle" fill="#2563eb" fontSize="14" fontWeight="700">
              下底 b
            </text>
            {showSecondTrapezoid ? <line x1={D2.x} y1={D2.y} x2={C2.x} y2={C2.y} stroke="#16a34a" strokeWidth="4" /> : null}
          </>
        ) : null}

        {/* ② 底边 a + b */}
        {showAddBase ? (
          <>
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#2563eb" strokeWidth="5" />
            <line x1={endD2.x} y1={endD2.y} x2={endC2.x} y2={endC2.y} stroke="#16a34a" strokeWidth="5" />
            {/* 标尺 */}
            <line x1={A.x} y1={A.y + 36} x2={endC2.x} y2={A.y + 36} stroke="#334155" strokeWidth="2" />
            <line x1={A.x} y1={A.y + 30} x2={A.x} y2={A.y + 42} stroke="#334155" strokeWidth="2" />
            <line x1={B.x} y1={A.y + 30} x2={B.x} y2={A.y + 42} stroke="#334155" strokeWidth="2" />
            <line x1={endC2.x} y1={A.y + 30} x2={endC2.x} y2={A.y + 42} stroke="#334155" strokeWidth="2" />
            <text x={(A.x + B.x) / 2} y={A.y + 54} textAnchor="middle" fill="#2563eb" fontSize="14" fontWeight="700">
              b = {bottomBase}
            </text>
            <text x={(B.x + endC2.x) / 2} y={A.y + 54} textAnchor="middle" fill="#16a34a" fontSize="14" fontWeight="700">
              a = {topBase}
            </text>
          </>
        ) : null}

        {/* ④ 对半分 */}
        {showHalve ? (
          <>
            <text x={B.x + 8} y={(B.y + endA2.y) / 2} fill="#ef4444" fontSize="13" fontWeight="700">
              对分
            </text>
          </>
        ) : null}

        <text x={360} y={340} textAnchor="middle" fill="#334155" fontSize="15" fontWeight="700">
          {stageExpression}
        </text>
      </svg>
    </TopicPanel>
  )
}
