'use client'

import { TopicContent } from '../../mathMotionTopics'
import GeneralPlaneTopic from './GeneralPlaneTopic'

export default function RhombusPropertiesTopic() {
  const content: TopicContent = {
    intro: '菱形的关键性质集中在边与对角线。',
    points: ['四边长度相等。', '对角线互相垂直且互相平分。', '每条对角线平分一组对角。'],
  }
  return <GeneralPlaneTopic title="菱形的性质" content={content} />
}
