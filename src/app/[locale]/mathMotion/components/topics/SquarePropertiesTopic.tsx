'use client'

import { TopicContent } from '../../mathMotionTopics'
import GeneralPlaneTopic from './GeneralPlaneTopic'

export default function SquarePropertiesTopic() {
  const content: TopicContent = {
    intro: '正方形同时具备“矩形 + 菱形”的核心性质。',
    points: [
      '四边相等，四角均为 90°。',
      '两条对角线长度相等、互相垂直并互相平分。',
      '有四条对称轴，旋转 90° 后与原图重合。',
    ],
  }
  return <GeneralPlaneTopic title="正方形的性质" content={content} />
}
