'use client'

import { TopicContent } from '../../mathMotionTopics'
import GeneralPlaneTopic from './GeneralPlaneTopic'

export default function TrapezoidDefinitionTopic() {
  const content: TopicContent = {
    intro: '梯形是仅有一组对边平行的四边形。',
    points: ['平行边称为上底与下底。', '两底间距离称为高 h。', '等腰梯形是常见特殊形式。'],
  }
  return <GeneralPlaneTopic title="梯形定义" content={content} />
}
