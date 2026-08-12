'use client'

import { MathMotionComponentName, MathMotionTopic } from '../../mathMotionTopics'
import { ReactElement } from 'react'
import TriangleDefinitionTopic from './TriangleDefinitionTopic'
import TriangleAreaPerimeterTopic from './TriangleAreaPerimeterTopic'
import TriangleAngleSumTopic from './TriangleAngleSumTopic'
import SquareFormulaTopic from './SquareFormulaTopic'
import SquarePropertiesTopic from './SquarePropertiesTopic'
import RectangleFormulaTopic from './RectangleFormulaTopic'
import RectanglePropertiesTopic from './RectanglePropertiesTopic'
import ParallelogramFormulaTopic from './ParallelogramFormulaTopic'
import ParallelogramPropertiesTopic from './ParallelogramPropertiesTopic'
import RhombusDefinitionTopic from './RhombusDefinitionTopic'
import RhombusPropertiesTopic from './RhombusPropertiesTopic'
import TrapezoidDefinitionTopic from './TrapezoidDefinitionTopic'
import TrapezoidAreaTopic from './TrapezoidAreaTopic'
import TrapezoidPropertiesTopic from './TrapezoidPropertiesTopic'
import RegularPolygonDefinitionTopic from './RegularPolygonDefinitionTopic'
import RegularPolygonAngleSumTopic from './RegularPolygonAngleSumTopic'

export const planeTopicComponentMap: Partial<Record<MathMotionComponentName, () => ReactElement>> = {
  TriangleDefinitionTopic,
  TriangleAreaPerimeterTopic,
  TriangleAngleSumTopic,
  SquareFormulaTopic,
  SquarePropertiesTopic,
  RectangleFormulaTopic,
  RectanglePropertiesTopic,
  ParallelogramFormulaTopic,
  ParallelogramPropertiesTopic,
  RhombusDefinitionTopic,
  RhombusPropertiesTopic,
  TrapezoidDefinitionTopic,
  TrapezoidAreaTopic,
  TrapezoidPropertiesTopic,
  RegularPolygonDefinitionTopic,
  RegularPolygonAngleSumTopic,
}

export function hasPlaneTopicComponent(topicId: MathMotionTopic) {
  return !!planeTopicComponentMap[topicId as MathMotionComponentName]
}
