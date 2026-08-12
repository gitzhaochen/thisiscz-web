'use client'

import { TopicContent } from '../../mathMotionTopics'
import GeneralPlaneTopic from './GeneralPlaneTopic'

export default function ParallelogramPropertiesTopic() {
  const content: TopicContent = {
    intro: '平行四边形由两组平行边定义，并带来一系列角线性质。',
    points: ['对边平行且相等。', '对角相等、邻角互补。', '两条对角线互相平分。'],
  }
  return <GeneralPlaneTopic title="平行四边形的性质" content={content} />
}
