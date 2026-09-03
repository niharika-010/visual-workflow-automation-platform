import { BaseNode } from './baseNode.js';

export class DelayNode extends BaseNode {
  constructor() {
    super('delay');
  }

  async execute(context) {
    const { config = {} } = context;
    const duration = Number(config.duration) || 1;
    const unit = config.unit || 'seconds';

    let delayMs = duration * 1000;
    if (unit === 'minutes') delayMs = duration * 60 * 1000;
    if (unit === 'hours') delayMs = duration * 60 * 60 * 1000;

    // Cap delay for synchronous demo/tests to max 10 seconds
    const actualMs = Math.min(delayMs, 10000);

    await new Promise((resolve) => setTimeout(resolve, actualMs));

    return {
      success: true,
      data: {
        delayedMs: actualMs,
        durationRequested: duration,
        unit,
        completedAt: new Date().toISOString(),
      },
    };
  }
}
