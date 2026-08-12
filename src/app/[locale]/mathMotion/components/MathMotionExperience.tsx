'use client'

import ArcLengthTopic from './topics/ArcLengthTopic'
import CircleFormulasTopic from './topics/CircleFormulasTopic'
import SectorAreaTopic from './topics/SectorAreaTopic'
import { MathMotionTopic, mathMotionTopics } from '../mathMotionTopics'
import { ChevronDown, Circle, Orbit, PieChart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

const iconMap = {
  circle: Circle,
  sector: PieChart,
  arc: Orbit,
} as const

type Props = {
  initialTopic: MathMotionTopic
}

export default function MathMotionExperience({ initialTopic }: Props) {
  const t = useTranslations('PageMathMotion')
  const [activeTopic, setActiveTopic] = useState(initialTopic)
  const [circleExpanded, setCircleExpanded] = useState(true)

  const selectTopic = (topic: MathMotionTopic) => {
    setActiveTopic(topic)
    const url = new URL(window.location.href)
    url.searchParams.set('topic', topic)
    window.history.replaceState(null, '', url)
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="bg-card rounded-2xl border p-3 shadow-sm lg:sticky lg:top-20">
          <button
            type="button"
            onClick={() => setCircleExpanded((value) => !value)}
            className="hover:bg-muted flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors"
          >
            <span className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-indigo-500" />
              {t('categoryCircle')}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${circleExpanded ? 'rotate-180' : ''}`} />
          </button>
          {circleExpanded ? (
            <nav aria-label={t('topicNavigation')} className="mt-1 grid gap-1 sm:grid-cols-3 lg:grid-cols-1">
              {mathMotionTopics.map(({ id, labelKey, iconName }, index) => {
                const Icon = iconMap[iconName]
                const active = activeTopic === id
                return (
                  <button
                    key={id}
                    type="button"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => selectTopic(id)}
                    className={`group flex min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      active
                        ? 'bg-indigo-600 font-semibold text-white shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                        active ? 'bg-white/15' : 'bg-muted group-hover:bg-background'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="mr-1.5 opacity-60">{index + 1}.</span>
                      {t(labelKey)}
                    </span>
                  </button>
                )
              })}
            </nav>
          ) : null}
        </aside>

        <section className="min-w-0" aria-live="polite">
          {activeTopic === 'circle-formulas' ? <CircleFormulasTopic /> : null}
          {activeTopic === 'sector-area' ? <SectorAreaTopic /> : null}
          {activeTopic === 'arc-length' ? <ArcLengthTopic /> : null}
        </section>
      </div>
    </main>
  )
}
