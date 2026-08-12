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

export type MathMotionCatalogTopic = {
  id: string
  label: string
  componentName: MathMotionComponentName
}

export type MathMotionCatalogCategory = {
  id: string
  label: string
  topics: MathMotionCatalogTopic[]
}

export const mathMotionCatalog: MathMotionCatalogCategory[] = [
  {
    id: 'circle',
    label: '圆形',
    topics: [
      { id: 'circle-formulas', label: '圆的周长和面积', componentName: 'CircleFormulasTopic' },
      { id: 'sector-area', label: '扇形的面积', componentName: 'SectorAreaTopic' },
      { id: 'arc-length', label: '弧长', componentName: 'ArcLengthTopic' },
    ],
  },
  {
    id: 'triangle',
    label: '三角形',
    topics: [
      { id: 'triangle-definition', label: '三角形的定义和分类', componentName: 'TriangleDefinitionTopic' },
      { id: 'triangle-area-perimeter', label: '三角形的面积和周长', componentName: 'TriangleAreaPerimeterTopic' },
      { id: 'triangle-angle-sum', label: '三角形的内角和180°定理', componentName: 'TriangleAngleSumTopic' },
    ],
  },
  {
    id: 'square',
    label: '正方形',
    topics: [
      { id: 'square-formula', label: '正方形的周长和面积', componentName: 'SquareFormulaTopic' },
      { id: 'square-properties', label: '正方形的性质', componentName: 'SquarePropertiesTopic' },
    ],
  },
  {
    id: 'rectangle',
    label: '长方形',
    topics: [
      { id: 'rectangle-formula', label: '长方形的周长和面积', componentName: 'RectangleFormulaTopic' },
      { id: 'rectangle-properties', label: '长方形的性质', componentName: 'RectanglePropertiesTopic' },
    ],
  },
  {
    id: 'parallelogram',
    label: '平行四边形',
    topics: [
      { id: 'parallelogram-formula', label: '平行四边形的周长和面积', componentName: 'ParallelogramFormulaTopic' },
      { id: 'parallelogram-properties', label: '平行四边形的性质', componentName: 'ParallelogramPropertiesTopic' },
    ],
  },
  {
    id: 'rhombus',
    label: '菱形',
    topics: [
      { id: 'rhombus-definition', label: '菱形的定义', componentName: 'RhombusDefinitionTopic' },
      { id: 'rhombus-properties', label: '菱形的性质', componentName: 'RhombusPropertiesTopic' },
    ],
  },
  {
    id: 'trapezoid',
    label: '梯形',
    topics: [
      { id: 'trapezoid-definition', label: '梯形的定义', componentName: 'TrapezoidDefinitionTopic' },
      { id: 'trapezoid-properties', label: '梯形的性质', componentName: 'TrapezoidPropertiesTopic' },
      { id: 'trapezoid-area', label: '梯形的面积', componentName: 'TrapezoidAreaTopic' },
    ],
  },
  {
    id: 'regular-polygon',
    label: '正多边形',
    topics: [
      { id: 'regular-polygon-definition', label: '正多边形定义', componentName: 'RegularPolygonDefinitionTopic' },
      { id: 'regular-polygon-angle-sum', label: '正多边形的内角和', componentName: 'RegularPolygonAngleSumTopic' },
    ],
  },
]

export const mathMotionTopics: MathMotionCatalogTopic[] = mathMotionCatalog.flatMap((category) => category.topics)

export type MathMotionTopic = (typeof mathMotionTopics)[number]['id']

export function isMathMotionTopic(value?: string): value is MathMotionTopic {
  return mathMotionTopics.some((topic) => topic.id === value)
}
