'use client'

import { TopicContent } from '../../mathMotionTopics'
import GeneralPlaneTopic from './GeneralPlaneTopic'

export default function RegularPolygonDefinitionTopic() {
  const content: TopicContent = {
    intro: '正多边形是边长和内角都相等的多边形。',
    points: ['常见：正三角形、正方形、正五边形等。', '可外接于同一圆，中心到顶点距离相等。', '边数越多越接近圆。'],
  }
  return <GeneralPlaneTopic title="正多边形定义" content={content} />
}
