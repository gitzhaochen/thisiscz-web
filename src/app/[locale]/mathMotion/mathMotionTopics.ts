export const mathMotionTopics = [
  { id: 'circle-formulas', labelKey: 'topics.circleFormulas', iconName: 'circle' },
  { id: 'sector-area', labelKey: 'topics.sectorArea', iconName: 'sector' },
  { id: 'arc-length', labelKey: 'topics.arcLength', iconName: 'arc' },
] as const

export type MathMotionTopic = (typeof mathMotionTopics)[number]['id']

export function isMathMotionTopic(value?: string): value is MathMotionTopic {
  return mathMotionTopics.some((topic) => topic.id === value)
}
