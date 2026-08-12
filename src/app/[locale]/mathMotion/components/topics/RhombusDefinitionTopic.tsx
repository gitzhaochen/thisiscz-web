'use client'

import { TopicContent } from '../../mathMotionTopics'
import GeneralPlaneTopic from './GeneralPlaneTopic'

export default function RhombusDefinitionTopic() {
  const content: TopicContent = {
    intro: '菱形是四边都相等的平行四边形。',
    points: ['可以看成“等边的平行四边形”。', '内角不一定是直角。', '当内角全是直角时即为正方形。'],
  }
  return <GeneralPlaneTopic title="菱形的定义" content={content} />
}
