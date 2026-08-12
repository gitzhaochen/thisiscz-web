'use client'

import { Hint, TopicPanel } from '../TopicUi'
import { useState } from 'react'

type ViewMode = 'definition' | 'properties' | 'symmetry'

export default function SquarePropertiesTopic() {
  const [mode, setMode] = useState<ViewMode>('definition')

  const square = { left: 220, top: 90, size: 180 }
  const right = square.left + square.size
  const bottom = square.top + square.size
  const cx = square.left + square.size / 2
  const cy = square.top + square.size / 2

  return (
    <TopicPanel
      title="正方形的性质"
      subtitle="正方形兼具矩形与菱形的特征，是特殊的平行四边形。"
      controls={
        <div className="space-y-4">
          <Hint>
            <span className="block font-semibold">定义</span>
            <span className="mt-1 block">有一组邻边相等，并且有一个角是直角的平行四边形，叫做正方形。</span>
          </Hint>
          {mode === 'properties' ? (
            <Hint>
              <span className="block font-semibold">性质定理</span>
              <span className="mt-1 block">1. 四个角都是直角，四条边都相等。</span>
              <span className="block">2. 两条对角线相等，互相垂直，且平分每一组对角。</span>
            </Hint>
          ) : null}
          {mode === 'symmetry' ? (
            <Hint>
              <span className="block font-semibold">对称性</span>
              <span className="mt-1 block">正方形是轴对称图形，有 4 条对称轴。</span>
              <span className="block">也是中心对称图形，对称中心是对角线交点。</span>
            </Hint>
          ) : null}
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['definition', '定义'],
                ['properties', '性质'],
                ['symmetry', '对称性'],
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
        <svg viewBox="0 0 720 360" className="w-full">
          <text x="360" y="32" textAnchor="middle" fill="#334155" fontSize="16" fontWeight="700">
            正方形可以看作“矩形 + 菱形”
          </text>

          {/* 矩形 → 正方形 */}
          <text x="200" y="62" textAnchor="middle" fill="#334155" fontSize="14" fontWeight="700">
            矩形 + 邻边相等
          </text>
          <rect x="90" y="80" width="130" height="85" fill="#bae6fd88" stroke="#0891b2" strokeWidth="2.5" />
          <text x="155" y="182" textAnchor="middle" fill="#0891b2" fontSize="12">
            矩形
          </text>
          <text x="248" y="128" fill="#64748b" fontSize="22" fontWeight="700">
            →
          </text>
          <rect x="280" y="80" width="105" height="105" fill="#bbf7d088" stroke="#16a34a" strokeWidth="2.5" />
          <text x="332" y="205" textAnchor="middle" fill="#16a34a" fontSize="12" fontWeight="700">
            正方形
          </text>

          {/* 菱形 → 正方形 */}
          <text x="560" y="62" textAnchor="middle" fill="#334155" fontSize="14" fontWeight="700">
            菱形 + 一个直角
          </text>
          <polygon points="530,185 590,115 650,185 590,255" fill="#ddd6fe88" stroke="#7c3aed" strokeWidth="2.5" />
          <text x="590" y="275" textAnchor="middle" fill="#7c3aed" fontSize="12">
            菱形
          </text>
          <text x="668" y="178" fill="#64748b" fontSize="22" fontWeight="700">
            →
          </text>
          <rect x="530" y="80" width="105" height="105" fill="#bbf7d088" stroke="#16a34a" strokeWidth="2.5" />
          <path d="M 530 100 L 550 100 L 550 80" fill="none" stroke="#16a34a" strokeWidth="2" />
          <text x="582" y="205" textAnchor="middle" fill="#16a34a" fontSize="12" fontWeight="700">
            正方形
          </text>

          <text x="360" y="330" textAnchor="middle" fill="#64748b" fontSize="13">
            平行四边形 ⊃ 矩形、菱形 ⊃ 正方形
          </text>
        </svg>
      ) : null}

      {mode === 'properties' ? (
        <svg viewBox="0 0 720 360" className="w-full">
          <rect x={square.left} y={square.top} width={square.size} height={square.size} fill="#bbf7d055" stroke="#16a34a" strokeWidth="3" />

          {/* 对角线 */}
          <line x1={square.left} y1={square.top} x2={right} y2={bottom} stroke="#7c3aed" strokeWidth="2" strokeDasharray="6 4" />
          <line x1={right} y1={square.top} x2={square.left} y2={bottom} stroke="#7c3aed" strokeWidth="2" strokeDasharray="6 4" />
          <circle cx={cx} cy={cy} r="5" fill="#7c3aed" />
          <text x={cx + 10} y={cy - 8} fill="#7c3aed" fontSize="13" fontWeight="700">
            O
          </text>

          {/* 顶点 */}
          <text x={square.left - 14} y={square.top - 6} fill="#16a34a" fontSize="15" fontWeight="700">
            A
          </text>
          <text x={right + 6} y={square.top - 6} fill="#16a34a" fontSize="15" fontWeight="700">
            B
          </text>
          <text x={right + 6} y={bottom + 16} fill="#16a34a" fontSize="15" fontWeight="700">
            C
          </text>
          <text x={square.left - 14} y={bottom + 16} fill="#16a34a" fontSize="15" fontWeight="700">
            D
          </text>

          {/* 直角标记 */}
          <path d={`M ${square.left + 18} ${square.top} L ${square.left + 18} ${square.top + 18} L ${square.left} ${square.top + 18}`} fill="none" stroke="#16a34a" strokeWidth="2" />

          {/* 等边标记 */}
          <text x={cx} y={square.top - 10} textAnchor="middle" fill="#d97706" fontSize="13" fontWeight="600">
            四边相等
          </text>
          <text x={cx} y={bottom + 30} textAnchor="middle" fill="#7c3aed" fontSize="13" fontWeight="600">
            对角线相等且互相垂直
          </text>

          <rect x="430" y="88" width="250" height="200" rx="12" fill="#f8fafc" stroke="#cbd5e1" />
          <text x="442" y="116" fill="#334155" fontSize="13" fontWeight="700">
            边与角
          </text>
          <text x="442" y="138" fill="#64748b" fontSize="12">
            · 对边平行，四边相等
          </text>
          <text x="442" y="158" fill="#64748b" fontSize="12">
            · 四个角都是 90°
          </text>
          <text x="442" y="186" fill="#334155" fontSize="13" fontWeight="700">
            对角线
          </text>
          <text x="442" y="208" fill="#64748b" fontSize="12">
            · AC = BD，且 AC ⊥ BD
          </text>
          <text x="442" y="228" fill="#64748b" fontSize="12">
            · 互相平分，平分每组对角
          </text>
          <text x="442" y="256" fill="#64748b" fontSize="12">
            · ∠BAC = ∠DAC = 45°
          </text>
        </svg>
      ) : null}

      {mode === 'symmetry' ? (
        <svg viewBox="0 0 720 360" className="w-full">
          <rect x={square.left} y={square.top} width={square.size} height={square.size} fill="#bbf7d055" stroke="#16a34a" strokeWidth="3" />

          {/* 4 条对称轴 */}
          <line x1={cx} y1={square.top - 20} x2={cx} y2={bottom + 20} stroke="#f97316" strokeWidth="2" strokeDasharray="5 4" />
          <line x1={square.left - 20} y1={cy} x2={right + 20} y2={cy} stroke="#f97316" strokeWidth="2" strokeDasharray="5 4" />
          <line x1={square.left - 15} y1={square.top - 15} x2={right + 15} y2={bottom + 15} stroke="#f97316" strokeWidth="2" strokeDasharray="5 4" />
          <line x1={right + 15} y1={square.top - 15} x2={square.left - 15} y2={bottom + 15} stroke="#f97316" strokeWidth="2" strokeDasharray="5 4" />

          <circle cx={cx} cy={cy} r="6" fill="#7c3aed" />
          <text x={cx + 12} y={cy + 4} fill="#7c3aed" fontSize="12" fontWeight="700">
            中心
          </text>

          <text x="360" y="40" textAnchor="middle" fill="#334155" fontSize="16" fontWeight="700">
            4 条对称轴
          </text>
          <text x="360" y="310" textAnchor="middle" fill="#64748b" fontSize="13">
            两条过对边中点，两条过对角顶点
          </text>
          <text x="360" y="332" textAnchor="middle" fill="#64748b" fontSize="13">
            绕中心旋转 90° 后与自身重合
          </text>
        </svg>
      ) : null}
    </TopicPanel>
  )
}
