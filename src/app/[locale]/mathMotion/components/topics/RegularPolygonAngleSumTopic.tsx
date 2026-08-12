'use client'

import { TopicContent } from '../../mathMotionTopics'
import GeneralPlaneTopic from './GeneralPlaneTopic'

export default function RegularPolygonAngleSumTopic() {
  const content: TopicContent = {
    intro: 'n 边形可从一个顶点划分为 (n-2) 个三角形。',
    points: ['每个三角形内角和 180°。', '总内角和 = 三角形数量 × 180°。', '正多边形每个内角相等，可继续除以 n。'],
    formulas: ['内角和 = (n - 2) × 180°', '每个内角 = ((n - 2) × 180°) / n'],
    animationType: 'polygon-angle-sum',
  }
  return <GeneralPlaneTopic title="正多边形的内角和公式" content={content} />
}
