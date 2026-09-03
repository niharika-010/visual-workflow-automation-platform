import { BaseNode } from './baseNode.js';

export class IfNode extends BaseNode {
  constructor() {
    super('if');
  }

  async execute(context) {
    const { inputData = {}, config = {} } = context;
    const { field, operator = 'equals', value: targetValue } = config;

    // Resolve field value from inputData using path across all possible nesting levels
    let actualValue = this.getValueByPath(inputData, field);
    if (actualValue === undefined && inputData.data) {
      actualValue = this.getValueByPath(inputData.data, field);
    }
    if (actualValue === undefined && inputData.data?.data) {
      actualValue = this.getValueByPath(inputData.data.data, field);
    }
    if (actualValue === undefined && inputData.data && typeof inputData.data === 'object') {
      actualValue = inputData.data[field];
    }
    if (actualValue === undefined && inputData[field] !== undefined) {
      actualValue = inputData[field];
    }

    let result = false;

    switch (operator) {
      case 'equals':
        result = String(actualValue) === String(targetValue);
        break;
      case 'not_equals':
        result = String(actualValue) !== String(targetValue);
        break;
      case 'greater_than':
        result = Number(actualValue) > Number(targetValue);
        break;
      case 'less_than':
        result = Number(actualValue) < Number(targetValue);
        break;
      case 'contains':
        result = String(actualValue || '').toLowerCase().includes(String(targetValue || '').toLowerCase());
        break;
      case 'is_true':
        result = Boolean(actualValue) === true;
        break;
      case 'is_false':
        result = Boolean(actualValue) === false;
        break;
      default:
        result = String(actualValue) === String(targetValue);
    }

    return {
      success: true,
      nextHandle: result ? 'true' : 'false',
      data: {
        conditionResult: result,
        evaluatedField: field,
        actualValue,
        targetValue,
        operator,
        selectedBranch: result ? 'true' : 'false',
      },
    };
  }
}
