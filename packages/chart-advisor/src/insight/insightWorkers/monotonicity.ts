// import { RowData, AGGREGATION } from '@antv/dw-transform';
import { RowData, autoTransform, AggregationType } from '../../../../datawizard/transform';
import { Insight } from '..';
import { Worker } from '.';
import { rowDataToColumnFrame, columnsToRowData, isMonotonicDec, isMonotonicInc } from './utils';

export const monotonicityIW: Worker = function(data: RowData[]): Insight[] {
  const insights: Insight[] = [];

  const { columnProps, columns } = rowDataToColumnFrame(data);

  for (let i = 0; i < columns.length; i++) {
    // todo: isOrdinal w. sort
    if (columnProps[i].isTime) {
      for (let j = 0; j < columns.length; j++) {
        if (columnProps[j].isInterval) {
          const dimensionTitle = columnProps[i].title;
          const measureTitle = columnProps[j].title;

          const subData = columnsToRowData([columns[i], columns[j]], [dimensionTitle, measureTitle]);

          if (subData) {
            // AGGREGATION.forEach((aggType) => {
            (['sum'] as AggregationType[]).forEach((aggType) => {
              const { result: aggData } = autoTransform(subData, false, aggType);
              aggData.sort((a, b) => a[dimensionTitle] - b[dimensionTitle]);
              const sortedMeasureCol = aggData.map((row) => row[measureTitle]);

              let direction = null;

              if (isMonotonicInc(sortedMeasureCol)) {
                direction = 'increasing';
              }
              if (isMonotonicDec(sortedMeasureCol)) {
                direction = 'decreasing';
              }

              if (direction) {
                const insight: Insight = {
                  type: 'Monotonicity',
                  fields: [dimensionTitle, measureTitle],
                  insightProps: {
                    dimensions: [dimensionTitle],
                    measures: [measureTitle],
                    score: 1,
                    detail: {
                      direction,
                    },
                  },
                };
                insights.push(insight);
              }
            });
          }
        }
      }
    }
  }

  return insights;
};