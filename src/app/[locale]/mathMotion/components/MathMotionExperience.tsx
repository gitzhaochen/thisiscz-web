'use client'

import ArcLengthTopic from './topics/ArcLengthTopic'
import CircleFormulasTopic from './topics/CircleFormulasTopic'
import { planeTopicComponentMap } from './topics/PlaneTopicComponents'
import SectorAreaTopic from './topics/SectorAreaTopic'
import {
  MathMotionComponentName,
  MathMotionTopic,
  mathMotionCatalog,
  mathMotionTopicMessageKey,
} from '../mathMotionTopics'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ReactElement, useMemo, useState } from 'react'

type Props = {
  initialTopic: MathMotionTopic
}

export default function MathMotionExperience({ initialTopic }: Props) {
  const t = useTranslations('PageMathMotion')
  const [activeTopic, setActiveTopic] = useState(initialTopic)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(mathMotionCatalog.map((category) => [category.id, category.id === 'circle'])),
  )

  const selectTopic = (topic: MathMotionTopic) => {
    setActiveTopic(topic)
    const url = new URL(window.location.href)
    url.searchParams.set('topic', topic)
    window.history.replaceState(null, '', url)
  }

  const activeTopicMeta = useMemo(
    () => mathMotionCatalog.flatMap((category) => category.topics).find((topic) => topic.id === activeTopic),
    [activeTopic],
  )

  const topicComponentMap: Partial<Record<MathMotionComponentName, () => ReactElement>> = {
    CircleFormulasTopic,
    SectorAreaTopic,
    ArcLengthTopic,
    ...planeTopicComponentMap,
  }

  const renderContent = () => {
    if (!activeTopicMeta) return null
    const TopicComponent = topicComponentMap[activeTopicMeta.componentName]
    if (TopicComponent) return <TopicComponent />
    return null
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="bg-card lg:sticky lg:top-20">
          <nav aria-label={t('common.navAriaLabel')} className="space-y-1">
            {mathMotionCatalog.map((category) => {
              const expanded = !!expandedCategories[category.id]
              return (
                <div key={category.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedCategories((prev) => ({ ...prev, [category.id]: !expanded }))}
                    className="hover:bg-muted flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors"
                  >
                    <span>{t(`categories.${category.id}`)}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                  {expanded ? (
                    <div className="mt-1 ml-3 flex flex-col gap-1 border-l pl-2">
                      {category.topics.map((topic, index) => {
                        const active = activeTopic === topic.id
                        return (
                          <button
                            key={topic.id}
                            type="button"
                            aria-current={active ? 'page' : undefined}
                            onClick={() => selectTopic(topic.id)}
                            className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                              active ? 'bg-indigo-600 font-semibold text-white' : 'hover:bg-muted'
                            }`}
                          >
                            {index + 1}. {t(`topics.${mathMotionTopicMessageKey(topic.id)}`)}
                          </button>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </nav>
        </aside>

        <section className="min-w-0" aria-live="polite">
          {renderContent()}
        </section>
      </div>
    </main>
  )
}
