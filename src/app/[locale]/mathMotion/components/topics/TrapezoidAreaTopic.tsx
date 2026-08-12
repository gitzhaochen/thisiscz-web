'use client'

import { TopicContent } from '../../mathMotionTopics'
import GeneralPlaneTopic from './GeneralPlaneTopic'

export default function TrapezoidAreaTopic() {
  const content: TopicContent = {
    intro: '梯形面积等于上下底平均值乘以高。',
    points: ['两个全等梯形可拼成平行四边形。', '拼后底边是 (a+b)，高不变。', '单个梯形面积是拼图一半。'],
    formulas: ['S = (a + b) × h / 2'],
    animationType: 'trapezoid-area',
  }
  return <GeneralPlaneTopic title="梯形的面积公式" content={content} />
}
