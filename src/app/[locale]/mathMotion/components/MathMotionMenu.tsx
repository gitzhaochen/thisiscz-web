'use client'

import {
  MathMotionTopic,
  findCategoryIdForTopic,
  mathMotionCatalog,
  mathMotionTopicMessageKey,
} from '../mathMotionTopics'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

type Props = {
  activeTopic: MathMotionTopic
  onSelectTopic: (topic: MathMotionTopic) => void
}

function buildExpandedState(activeTopic: MathMotionTopic): Record<string, boolean> {
  const activeCategoryId = findCategoryIdForTopic(activeTopic)
  return Object.fromEntries(mathMotionCatalog.map((category) => [category.id, category.id === activeCategoryId]))
}

export default function MathMotionMenu({ activeTopic, onSelectTopic }: Props) {
  const t = useTranslations('PageMathMotion')
  const [expandedCategories, setExpandedCategories] = useState(() => buildExpandedState(activeTopic))

  const selectTopic = (topic: MathMotionTopic) => {
    const categoryId = findCategoryIdForTopic(topic)
    if (categoryId) {
      setExpandedCategories((prev) => ({ ...prev, [categoryId]: true }))
    }
    onSelectTopic(topic)
  }

  return (
    <aside className="bg-card lg:sticky lg:top-20">
      <nav aria-label={t('common.navAriaLabel')} className="space-y-1">
        {mathMotionCatalog.map((category) => {
          const expanded = !!expandedCategories[category.id]
          return (
            <div key={category.id}>
              <button
                type="button"
                onClick={() => setExpandedCategories((prev) => ({ ...prev, [category.id]: !expanded }))}
                className="flex w-full items-center justify-between border-b px-3 py-2 text-left text-sm font-semibold transition-colors hover:text-indigo-600/80"
              >
                <span>{t(`categories.${category.id}`)}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
              {expanded ? (
                <div className="mt-1 ml-3 flex flex-col gap-1">
                  {category.topics.map((topic, index) => {
                    const active = activeTopic === topic.id
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        aria-current={active ? 'page' : undefined}
                        onClick={() => selectTopic(topic.id)}
                        className={`px-3 py-2 text-left text-sm transition-colors ${
                          active ? 'border-b font-semibold text-indigo-600' : 'border-b hover:text-indigo-600/80'
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
  )
}
