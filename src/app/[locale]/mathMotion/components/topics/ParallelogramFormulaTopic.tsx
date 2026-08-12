'use client'

import { TopicContent } from '../../mathMotionTopics'
import GeneralPlaneTopic from './GeneralPlaneTopic'

export default function ParallelogramFormulaTopic() {
  const content: TopicContent = {
    intro: '平行四边形面积可通过“剪拼”转化为长方形面积。',
    points: ['设底为 b，高为 h。', '剪下左侧三角形平移到右侧，拼成长方形。', '面积保持不变。'],
    formulas: ['S = b × h', 'P = 2(a + b)'],
    animationType: 'parallelogram-area',
  }
  return <GeneralPlaneTopic title="平行四边形的周长和面积" content={content} />
}
