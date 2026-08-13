'use client'

import ArcLengthTopic from './topics/ArcLengthTopic'
import CircleFormulasTopic from './topics/CircleFormulasTopic'
import { planeTopicComponentMap } from './topics/PlaneTopicComponents'
import SectorAreaTopic from './topics/SectorAreaTopic'
import MathMotionMenu from './MathMotionMenu'
import { MathMotionComponentName, MathMotionTopic, mathMotionCatalog } from '../mathMotionTopics'
import { ReactElement, useMemo, useState } from 'react'

type Props = {
  initialTopic: MathMotionTopic
}

export default function MathMotionExperience({ initialTopic }: Props) {
  const [activeTopic, setActiveTopic] = useState(initialTopic)

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
    <main className="mx-auto w-full max-w-[1600px] px-2 py-6 [&_button]:cursor-pointer">
      <div className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <MathMotionMenu activeTopic={activeTopic} onSelectTopic={selectTopic} />
        <section className="min-w-0" aria-live="polite">
          {renderContent()}
        </section>
      </div>
    </main>
  )
}
