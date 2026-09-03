import { BaseNode } from './baseNode.js';
import axios from 'axios';

export class HttpNode extends BaseNode {
  constructor() {
    super('httpRequest');
  }

  async execute(context) {
    const { config = {} } = context;

    const method = (config.method || 'GET').toUpperCase();
    let url = config.url || 'https://httpbin.org/get';

    let headers = {};
    if (config.headers) {
      try {
        headers = typeof config.headers === 'string' ? JSON.parse(config.headers) : config.headers;
      } catch (e) {
        headers = {};
      }
    }

    let body = null;
    if (config.body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      try {
        body = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
      } catch (e) {
        body = config.body;
      }
    }

    try {
      const response = await axios({
        method,
        url,
        headers,
        data: body,
        params: config.queryParams || {},
        timeout: 10000,
      });

      return {
        success: true,
        data: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err.response
          ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`
          : err.message || 'HTTP request execution failed',
        data: {
          status: err.response ? err.response.status : 500,
          error: err.message,
        },
      };
    }
  }
}
