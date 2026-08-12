'use client'

import { FormulaBox, Hint, TopicPanel } from '../TopicUi'
import { useState } from 'react'

type ViewMode = 'definition' | 'by-side' | 'by-angle'

export default function TriangleDefinitionTopic() {
  const [mode, setMode] = useState<ViewMode>('definition')

  return (
    <TopicPanel
      title="三角形的定义和分类"
      subtitle="认识三角形的基本元素、三边关系，并按边与角进行分类。"
      controls={
        <div className="space-y-4">
          <Hint>
            <span className="block font-semibold">定义</span>
            <span className="mt-1 block">由不在同一直线上的三条线段首尾顺次联结所组成的图形，叫做三角形。</span>
          </Hint>
          {mode === 'definition' ? (
            <Hint>
              <span className="block font-semibold">记号</span>
              <span className="mt-1 block">边可用大写顶点表示：AB、BC、AC。</span>
              <span className="block">小写 a、b、c 分别表示 ∠A、∠B、∠C 的对边。</span>
            </Hint>
          ) : (
            <>
              <Hint>
                <span className="block font-semibold">三边关系</span>
                <span className="mt-1 block">三角形任意两边之和大于第三边；任意两边之差小于第三边。</span>
                <span className="mt-1 block text-[11px] opacity-90">
                  判断能否构成三角形：看两条较短边之和是否大于最长边。
                </span>
              </Hint>
              <FormulaBox label="三边关系" formula="a + b > c，b + c > a，c + a > b" value=" " />
            </>
          )}
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['definition', '定义与记号'],
                ['by-side', '按边分类'],
                ['by-angle', '按角分类'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={`rounded-lg px-2 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                  mode === key ? 'bg-indigo-600 text-white' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {mode === 'definition' ? (
        <svg viewBox="0 0 760 360" className="w-full">
          <text x="300" y="36" fill="#334155" fontSize="18" fontWeight="700" textAnchor="middle">
            △ABC 的组成元素
          </text>

          {/* 三角形 */}
          <polygon points="180,250 520,250 350,90" fill="#dbeafe" stroke="#2563eb" strokeWidth="3" />

          {/* 顶点 */}
          <circle cx="350" cy="90" r="5" fill="#2563eb" />
          <circle cx="180" cy="250" r="5" fill="#2563eb" />
          <circle cx="520" cy="250" r="5" fill="#2563eb" />
          <text x="350" y="76" fill="#2563eb" fontSize="16" fontWeight="700" textAnchor="middle">
            A
          </text>
          <text x="166" y="272" fill="#2563eb" fontSize="16" fontWeight="700">
            B
          </text>
          <text x="528" y="272" fill="#2563eb" fontSize="16" fontWeight="700">
            C
          </text>

          {/* 边：小写字母表示对边 */}
          <text x="350" y="272" fill="#d97706" fontSize="14" fontWeight="700" textAnchor="middle">
            BC = a
          </text>
          <text
            x="248"
            y="168"
            fill="#d97706"
            fontSize="14"
            fontWeight="700"
            textAnchor="middle"
            transform="rotate(-56 248 168)"
          >
            AB = c
          </text>
          <text
            x="452"
            y="168"
            fill="#d97706"
            fontSize="14"
            fontWeight="700"
            textAnchor="middle"
            transform="rotate(56 452 168)"
          >
            AC = b
          </text>

          {/* 内角 */}
          <path d="M 350 110 A 28 28 0 0 1 378 128" fill="none" stroke="#7c3aed" strokeWidth="2.5" />
          <text x="388" y="126" fill="#7c3aed" fontSize="13" fontWeight="600">
            ∠A
          </text>
          <path d="M 210 238 A 24 24 0 0 1 198 214" fill="none" stroke="#7c3aed" strokeWidth="2.5" />
          <text x="186" y="210" fill="#7c3aed" fontSize="13" fontWeight="600">
            ∠B
          </text>
          <path d="M 490 238 A 24 24 0 0 0 502 214" fill="none" stroke="#7c3aed" strokeWidth="2.5" />
          <text x="508" y="210" fill="#7c3aed" fontSize="13" fontWeight="600">
            ∠C
          </text>

          <text x="350" y="330" textAnchor="middle" fill="#64748b" fontSize="13">
            三条线段不在同一直线上，且首尾顺次联结
          </text>
        </svg>
      ) : null}

      {mode === 'by-side' ? (
        <svg viewBox="0 0 760 360" className="w-full">
          <text x="110" y="62" fill="#334155" fontSize="18" fontWeight="700">
            等边三角形
          </text>
          <polygon points="70,250 210,250 140,129" fill="#bfdbfe" stroke="#2563eb" strokeWidth="3" />
          <text x="96" y="268" fill="#2563eb" fontSize="13">
            三边都相等
          </text>

          <text x="345" y="62" fill="#334155" fontSize="18" fontWeight="700">
            等腰三角形
          </text>
          <polygon points="300,250 460,250 380,112" fill="#bbf7d0" stroke="#16a34a" strokeWidth="3" />
          <text x="352" y="268" fill="#16a34a" fontSize="13">
            有两条边相等（腰）
          </text>

          <text x="582" y="62" fill="#334155" fontSize="18" fontWeight="700">
            不等边三角形
          </text>
          <polygon points="540,250 715,250 618,142" fill="#fde68a" stroke="#d97706" strokeWidth="3" />
          <text x="603" y="268" fill="#d97706" fontSize="13">
            三边都不相等
          </text>

          <text x="380" y="320" textAnchor="middle" fill="#64748b" fontSize="13">
            等边三角形是等腰三角形的特例
          </text>
        </svg>
      ) : null}

      {mode === 'by-angle' ? (
        <svg viewBox="0 0 760 360" className="w-full">
          <text x="120" y="62" fill="#334155" fontSize="18" fontWeight="700">
            锐角三角形
          </text>
          <polygon points="70,250 190,250 132,120" fill="#bfdbfe" stroke="#2563eb" strokeWidth="3" />
          <text x="88" y="268" fill="#2563eb" fontSize="13">
            三个角都是锐角
          </text>

          <text x="340" y="62" fill="#334155" fontSize="18" fontWeight="700">
            直角三角形
          </text>
          <polygon points="300,250 440,250 300,120" fill="#bbf7d0" stroke="#16a34a" strokeWidth="3" />
          <path d="M 300 230 L 320 230 L 320 250" fill="none" stroke="#16a34a" strokeWidth="3" />
          <text x="328" y="244" fill="#16a34a" fontSize="14" fontWeight="700">
            90°
          </text>
          <text x="326" y="268" fill="#16a34a" fontSize="13">
            有一个角是直角
          </text>

          <text x="574" y="62" fill="#334155" fontSize="18" fontWeight="700">
            钝角三角形
          </text>
          {/* 钝角在左下角 B，A 偏左使 ∠B > 90° */}
          <polygon points="540,250 700,250 495,168" fill="#fde68a" stroke="#d97706" strokeWidth="3" />
          <path d="M 578 250 A 36 36 0 0 0 522 220" fill="none" stroke="#d97706" strokeWidth="3" />
          <text x="548" y="232" fill="#d97706" fontSize="14" fontWeight="700">
            &gt;90°
          </text>
          <text x="568" y="268" fill="#d97706" fontSize="13">
            有一个角是钝角
          </text>

          <text x="380" y="320" textAnchor="middle" fill="#64748b" fontSize="13">
            一个三角形最多有 1 个直角，最多有 1 个钝角
          </text>
        </svg>
      ) : null}
    </TopicPanel>
  )
}
