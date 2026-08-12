'use client'

import { TopicContent } from '../../mathMotionTopics'
import GeneralPlaneTopic from './GeneralPlaneTopic'

export default function TrapezoidPropertiesTopic() {
  const content: TopicContent = {
    intro: '梯形性质围绕“单组平行边”展开。',
    points: ['同一腰上的两个内角互补。', '中位线平行于底，长度为 (a+b)/2。', '等腰梯形两腰相等且同底角相等。'],
  }
  return <GeneralPlaneTopic title="梯形的性质" content={content} />
}
