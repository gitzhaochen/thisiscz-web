'use client'

import { TopicContent } from '../../mathMotionTopics'
import GeneralPlaneTopic from './GeneralPlaneTopic'

export default function RectanglePropertiesTopic() {
  const content: TopicContent = {
    intro: '长方形是四角都为直角的四边形。',
    points: ['对边平行且相等。', '四个内角都为90°。', '两条对角线相等且互相平分。'],
  }
  return <GeneralPlaneTopic title="长方形的性质" content={content} />
}
