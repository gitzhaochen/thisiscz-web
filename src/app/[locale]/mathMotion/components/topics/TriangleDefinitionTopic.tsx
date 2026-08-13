'use client'

import { FormulaBox, Hint, TopicPanel } from '../TopicUi'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

type ViewMode = 'definition' | 'by-side' | 'by-angle'

export default function TriangleDefinitionTopic() {
  const t = useTranslations('PageMathMotion.triangleDefinition')
  const [mode, setMode] = useState<ViewMode>('definition')

  return (
    <TopicPanel
      title={t('title')}
      subtitle={t('subtitle')}
      controls={
        <div className="space-y-4">
          <Hint>
            <span className="block font-semibold">{t('definitionTitle')}</span>
            <span className="mt-1 block">{t('definitionBody')}</span>
          </Hint>
          {mode === 'definition' ? (
            <Hint>
              <span className="block font-semibold">{t('notationTitle')}</span>
              <span className="mt-1 block">{t('notationBody1')}</span>
              <span className="block">{t('notationBody2')}</span>
            </Hint>
          ) : (
            <>
              <Hint>
                <span className="block font-semibold">{t('sideRelationTitle')}</span>
                <span className="mt-1 block">{t('sideRelationBody')}</span>
                <span className="mt-1 block text-[11px] opacity-90">{t('sideRelationTip')}</span>
              </Hint>
              <FormulaBox label={t('sideRelationLabel')} formula="a + b > c，b + c > a，c + a > b" value=" " />
            </>
          )}
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['definition', 'tabDefinition'],
                ['by-side', 'tabBySide'],
                ['by-angle', 'tabByAngle'],
              ] as const
            ).map(([key, labelKey]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={`rounded-lg px-1.5 py-2 text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  mode === key ? 'bg-indigo-600 text-white' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {mode === 'definition' ? (
        <svg viewBox="0 0 760 360" className="w-full">
          <text x="300" y="36" fill="#334155" fontSize="18" fontWeight="700" textAnchor="middle">
            {t('elementsTitle')}
          </text>

          <polygon points="180,250 520,250 350,90" fill="#dbeafe" stroke="#2563eb" strokeWidth="3" />

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
            {t('elementsFooter')}
          </text>
        </svg>
      ) : null}

      {mode === 'by-side' ? (
        <svg viewBox="0 0 760 360" className="w-full">
          <text x="110" y="62" fill="#334155" fontSize="18" fontWeight="700">
            {t('equilateral')}
          </text>
          <polygon points="70,250 210,250 140,129" fill="#bfdbfe" stroke="#2563eb" strokeWidth="3" />
          <text x="96" y="268" fill="#2563eb" fontSize="13">
            {t('equilateralDesc')}
          </text>

          <text x="345" y="62" fill="#334155" fontSize="18" fontWeight="700">
            {t('isosceles')}
          </text>
          <polygon points="300,250 460,250 380,112" fill="#bbf7d0" stroke="#16a34a" strokeWidth="3" />
          <text x="352" y="268" fill="#16a34a" fontSize="13">
            {t('isoscelesDesc')}
          </text>

          <text x="582" y="62" fill="#334155" fontSize="18" fontWeight="700">
            {t('scalene')}
          </text>
          <polygon points="540,250 715,250 618,142" fill="#fde68a" stroke="#d97706" strokeWidth="3" />
          <text x="603" y="268" fill="#d97706" fontSize="13">
            {t('scaleneDesc')}
          </text>

          <text x="380" y="320" textAnchor="middle" fill="#64748b" fontSize="13">
            {t('bySideFooter')}
          </text>
        </svg>
      ) : null}

      {mode === 'by-angle' ? (
        <svg viewBox="0 0 760 360" className="w-full">
          <text x="120" y="62" fill="#334155" fontSize="18" fontWeight="700">
            {t('acute')}
          </text>
          <polygon points="70,250 190,250 132,120" fill="#bfdbfe" stroke="#2563eb" strokeWidth="3" />
          <text x="88" y="268" fill="#2563eb" fontSize="13">
            {t('acuteDesc')}
          </text>

          <text x="340" y="62" fill="#334155" fontSize="18" fontWeight="700">
            {t('right')}
          </text>
          <polygon points="300,250 440,250 300,120" fill="#bbf7d0" stroke="#16a34a" strokeWidth="3" />
          <path d="M 300 230 L 320 230 L 320 250" fill="none" stroke="#16a34a" strokeWidth="3" />
          <text x="328" y="244" fill="#16a34a" fontSize="14" fontWeight="700">
            90°
          </text>
          <text x="326" y="268" fill="#16a34a" fontSize="13">
            {t('rightDesc')}
          </text>

          <text x="574" y="62" fill="#334155" fontSize="18" fontWeight="700">
            {t('obtuse')}
          </text>
          <polygon points="540,250 700,250 495,168" fill="#fde68a" stroke="#d97706" strokeWidth="3" />
          <path d="M 578 250 A 36 36 0 0 0 522 220" fill="none" stroke="#d97706" strokeWidth="3" />
          <text x="548" y="232" fill="#d97706" fontSize="14" fontWeight="700">
            &gt;90°
          </text>
          <text x="568" y="268" fill="#d97706" fontSize="13">
            {t('obtuseDesc')}
          </text>

          <text x="380" y="320" textAnchor="middle" fill="#64748b" fontSize="13">
            {t('byAngleFooter')}
          </text>
        </svg>
      ) : null}
    </TopicPanel>
  )
}
