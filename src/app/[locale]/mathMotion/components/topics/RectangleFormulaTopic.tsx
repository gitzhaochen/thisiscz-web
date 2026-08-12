'use client'

import { TopicContent } from '../../mathMotionTopics'
import GeneralPlaneTopic from './GeneralPlaneTopic'

export default function RectangleFormulaTopic() {
  const content: TopicContent = {
    intro: '长方形由长 l 和宽 w 描述，公式直接由边关系得到。',
    points: ['对边相等：两条长是 l，两条宽是 w。', '周长由两组对边求和。', '面积是长乘宽。'],
    formulas: ['P = 2(l + w)', 'S = l × w'],
    animationType: 'rectangle-formula',
  }
  return <GeneralPlaneTopic title="长方形的周长和面积公式" content={content} />
}
