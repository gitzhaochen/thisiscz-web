export type TopicAnimationType =
  | 'triangle-area'
  | 'triangle-angle-sum'
  | 'square-formula'
  | 'rectangle-formula'
  | 'parallelogram-area'
  | 'trapezoid-area'
  | 'polygon-angle-sum'

export type TopicContent = {
  intro: string
  points: string[]
  formulas?: string[]
  animationType?: TopicAnimationType
}

export type MathMotionComponentName =
  | 'CircleFormulasTopic'
  | 'SectorAreaTopic'
  | 'ArcLengthTopic'
  | 'TriangleDefinitionTopic'
  | 'TriangleAreaPerimeterTopic'
  | 'TriangleAngleSumTopic'
  | 'PythagoreanTheoremTopic'
  | 'SquareFormulaTopic'
  | 'SquarePropertiesTopic'
  | 'RectangleFormulaTopic'
  | 'RectanglePropertiesTopic'
  | 'ParallelogramFormulaTopic'
  | 'ParallelogramPropertiesTopic'
  | 'RhombusDefinitionTopic'
  | 'RhombusPropertiesTopic'
  | 'TrapezoidDefinitionTopic'
  | 'TrapezoidAreaTopic'
  | 'TrapezoidPropertiesTopic'
  | 'RegularPolygonDefinitionTopic'
  | 'RegularPolygonAngleSumTopic'
  | 'PolygonAngleSumsTopic'

export type MathMotionCatalogTopic = {
  id: string
  componentName: MathMotionComponentName
}

export type MathMotionCatalogCategory = {
  id: string
  topics: MathMotionCatalogTopic[]
}

/** topic id `circle-formulas` → message key `circleFormulas` */
export function mathMotionTopicMessageKey(id: string): string {
  return id.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())
}

export const mathMotionCatalog: MathMotionCatalogCategory[] = [
  {
    id: 'circle',
    topics: [
      { id: 'circle-formulas', componentName: 'CircleFormulasTopic' },
      { id: 'sector-area', componentName: 'SectorAreaTopic' },
      { id: 'arc-length', componentName: 'ArcLengthTopic' },
    ],
  },
  {
    id: 'triangle',
    topics: [
      { id: 'triangle-definition', componentName: 'TriangleDefinitionTopic' },
      { id: 'triangle-area-perimeter', componentName: 'TriangleAreaPerimeterTopic' },
      { id: 'triangle-angle-sum', componentName: 'TriangleAngleSumTopic' },
      { id: 'pythagorean-theorem', componentName: 'PythagoreanTheoremTopic' },
    ],
  },
  {
    id: 'square',
    topics: [
      { id: 'square-properties', componentName: 'SquarePropertiesTopic' },
      { id: 'square-formula', componentName: 'SquareFormulaTopic' },
    ],
  },
  {
    id: 'rectangle',
    topics: [
      { id: 'rectangle-properties', componentName: 'RectanglePropertiesTopic' },
      { id: 'rectangle-formula', componentName: 'RectangleFormulaTopic' },
    ],
  },
  {
    id: 'parallelogram',
    topics: [
      { id: 'parallelogram-properties', componentName: 'ParallelogramPropertiesTopic' },
      { id: 'parallelogram-formula', componentName: 'ParallelogramFormulaTopic' },
    ],
  },
  {
    id: 'trapezoid',
    topics: [
      { id: 'trapezoid-definition', componentName: 'TrapezoidDefinitionTopic' },
      { id: 'trapezoid-properties', componentName: 'TrapezoidPropertiesTopic' },
      { id: 'trapezoid-area', componentName: 'TrapezoidAreaTopic' },
    ],
  },
  {
    id: 'rhombus',
    topics: [
      { id: 'rhombus-definition', componentName: 'RhombusDefinitionTopic' },
      { id: 'rhombus-properties', componentName: 'RhombusPropertiesTopic' },
    ],
  },
  {
    id: 'polygon',
    topics: [{ id: 'polygon-angle-sums', componentName: 'PolygonAngleSumsTopic' }],
  },
]

export const mathMotionTopics: MathMotionCatalogTopic[] = mathMotionCatalog.flatMap((category) => category.topics)

export type MathMotionTopic = (typeof mathMotionTopics)[number]['id']

export function isMathMotionTopic(value?: string): value is MathMotionTopic {
  return mathMotionTopics.some((topic) => topic.id === value)
}
