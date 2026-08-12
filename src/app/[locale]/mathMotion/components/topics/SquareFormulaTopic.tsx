'use client'

import { TopicContent } from '../../mathMotionTopics'
import GeneralPlaneTopic from './GeneralPlaneTopic'

export default function SquareFormulaTopic() {
  const content: TopicContent = {
    intro: '正方形边长统一为 a，周长和面积可以直接从边长关系得到。',
    points: ['四边相等，每边都是 a。', '周长是四条边总和。', '面积等于边长乘边长。'],
    formulas: ['P = 4a', 'S = a²'],
    animationType: 'square-formula',
  }
  return <GeneralPlaneTopic title="正方形的周长和面积推导" content={content} />
}
