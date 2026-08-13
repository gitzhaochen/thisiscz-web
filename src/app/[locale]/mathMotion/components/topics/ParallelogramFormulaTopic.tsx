'use client'

import { FormulaBox, Hint, NumberControl, TopicPanel } from '../TopicUi'
import { Play, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Mode = 'perimeter' | 'area'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const lerp = (from: number, to: number, t: number) => from + (to - from) * t
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

export default function ParallelogramFormulaTopic() {
  const [mode, setMode] = useState<Mode>('area')
  const [sideA, setSideA] = useState(5)
  const [sideB, setSideB] = useState(8)
  const [height, setHeight] = useState(5)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)

  const perimeter = 2 * (sideA + sideB)
  const area = sideB * height

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

  // 图形尺寸（固定展示尺寸，数值只影响公式）
  const basePx = 260
  const heightPx = 130
  const skewPx = 70
  // 初始平行四边形居中；剪拼成长方形后也居中
  const paraWidth = basePx + skewPx
  const paraOriginX = (720 - paraWidth) / 2
  const rectOriginX = (720 - basePx) / 2 - skewPx
  const originX = mode === 'area' ? lerp(paraOriginX, rectOriginX, progress) : paraOriginX
  const originY = 90

  // 平行四边形顶点：D--C
  //                   A--B
  const A = { x: originX, y: originY + heightPx }
  const B = { x: originX + basePx, y: originY + heightPx }
  const C = { x: originX + basePx + skewPx, y: originY }
  const D = { x: originX + skewPx, y: originY }

  // 左侧直角三角形：A--D--E（E 为 D 在底边的垂足）
  const E = { x: D.x, y: A.y }
  // 平移后三角形到达右侧：B--F--G，其中 F = (B.x + skewPx, B.y - heightPx) = 原 C 的右侧位置
  // 剪拼：把 △ADE 平移到右侧，变成 △BFG，拼成长方形 A B F D
  const slide = lerp(0, basePx, progress)
  const triA = { x: A.x + slide, y: A.y }
  const triD = { x: D.x + slide, y: D.y }
  const triE = { x: E.x + slide, y: E.y }

  return (
    <TopicPanel
      title="平行四边形的周长和面积"
      subtitle="周长由对边相等得到；面积通过“剪拼”转化为长方形：S = 底 × 高。"
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

          {mode === 'perimeter' ? (
            <>
              <NumberControl
                id="para-side-a"
                label="邻边 a"
                value={sideA}
                min={2}
                max={12}
                step={0.5}
                unit="cm"
                onChange={setSideA}
              />
              <NumberControl
                id="para-side-b"
                label="底边 b"
                value={sideB}
                min={3}
                max={15}
                step={0.5}
                unit="cm"
                onChange={setSideB}
              />
              <FormulaBox label="周长" formula="P = 2(a + b)" value={`${perimeter.toFixed(1)} cm`} />
              <Hint>
                <span className="block font-semibold">推导</span>
                <span className="mt-1 block">平行四边形对边相等：AB = CD = b，AD = BC = a。</span>
                <span className="block">周长 = a + b + a + b = 2(a + b)。</span>
              </Hint>
            </>
          ) : (
            <>
              <NumberControl
                id="para-base"
                label="底 b"
                value={sideB}
                min={3}
                max={15}
                step={0.5}
                unit="cm"
                onChange={setSideB}
              />
              <NumberControl
                id="para-height"
                label="高 h"
                value={height}
                min={2}
                max={10}
                step={0.5}
                unit="cm"
                onChange={setHeight}
              />
              <FormulaBox label="面积" formula="S = b × h" value={`${area.toFixed(1)} cm²`} />
              <button
                type="button"
                disabled={playing}
                onClick={playArea}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                {playing ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {playing ? '剪拼中...' : '播放剪拼动画'}
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
                <span className="block font-semibold">推导思路</span>
                <span className="mt-1 block">从顶点向底边作高，剪下左侧直角三角形。</span>
                <span className="block">平移到右侧，刚好拼成长方形。</span>
                <span className="block">面积不变：S = 长 × 宽 = b × h。</span>
              </Hint>
            </>
          )}
        </div>
      }
    >
      {mode === 'perimeter' ? (
        <svg viewBox="0 0 720 360" className="w-full">
          <polygon
            points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}`}
            fill="#fde68a88"
            stroke="#d97706"
            strokeWidth="3"
          />
          <text x={(A.x + B.x) / 2} y={A.y + 22} textAnchor="middle" fill="#d97706" fontSize="15" fontWeight="700">
            b = {sideB}
          </text>
          <text x={(D.x + C.x) / 2} y={D.y - 12} textAnchor="middle" fill="#d97706" fontSize="15" fontWeight="700">
            b
          </text>
          <text
            x={(A.x + D.x) / 2 - 18}
            y={(A.y + D.y) / 2 + 4}
            textAnchor="middle"
            fill="#0891b2"
            fontSize="15"
            fontWeight="700"
          >
            a = {sideA}
          </text>
          <text
            x={(B.x + C.x) / 2 + 18}
            y={(B.y + C.y) / 2 + 4}
            textAnchor="middle"
            fill="#0891b2"
            fontSize="15"
            fontWeight="700"
          >
            a
          </text>
          <text x={360} y={320} textAnchor="middle" fill="#334155" fontSize="16" fontWeight="700">
            P = 2(a + b) = 2({sideA} + {sideB}) = {perimeter.toFixed(1)} cm
          </text>
        </svg>
      ) : (
        <svg viewBox="0 0 720 360" className="w-full">
          {/* 主体：剪拼过程中逐渐变成矩形 */}
          <polygon
            points={`${E.x},${E.y} ${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}`}
            fill="#fde68a88"
            stroke="#d97706"
            strokeWidth="3"
            opacity={lerp(1, 0.85, progress)}
          />

          {/* 左侧被剪下的三角形（平移） */}
          <polygon
            points={`${triA.x},${triA.y} ${triE.x},${triE.y} ${triD.x},${triD.y}`}
            fill="#fbbf2488"
            stroke="#d97706"
            strokeWidth="2.5"
          />

          {/* 高 */}
          <line x1={D.x} y1={D.y} x2={E.x} y2={E.y} stroke="#f97316" strokeWidth="2" strokeDasharray="5 4" />
          <text x={D.x + 8} y={(D.y + E.y) / 2} fill="#f97316" fontSize="14" fontWeight="700">
            h
          </text>

          {/* 直角标记 */}
          <path
            d={`M ${E.x - 12} ${E.y} L ${E.x - 12} ${E.y - 12} L ${E.x} ${E.y - 12}`}
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
          />

          {/* 底边标注 */}
          <text x={(E.x + B.x) / 2} y={A.y + 22} textAnchor="middle" fill="#d97706" fontSize="14" fontWeight="700">
            底 b = {sideB}
          </text>

          {/* 剪拼完成后的长方形虚线框 */}
          {progress > 0.75 ? (
            <>
              <rect
                x={E.x}
                y={D.y}
                width={basePx}
                height={heightPx}
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <text x={E.x + basePx / 2} y={D.y - 14} textAnchor="middle" fill="#64748b" fontSize="14" fontWeight="700">
                长方形：长 = b，宽 = h
              </text>
              <text x={360} y={320} textAnchor="middle" fill="#334155" fontSize="16" fontWeight="700">
                S = b × h = {sideB} × {height} = {area.toFixed(1)} cm²
              </text>
            </>
          ) : (
            <text x={360} y={320} textAnchor="middle" fill="#64748b" fontSize="14">
              {progress > 0 ? '左侧三角形正在平移到右侧……' : '点击播放，观察剪拼成长方形的过程'}
            </text>
          )}
        </svg>
      )}
    </TopicPanel>
  )
}
