/**
 * @fileoverview 로깅 유틸리티
 * Edge Runtime과 Node.js Runtime 모두에서 사용 가능
 */

/**
 * 로그 메시지 형식화
 */
const formatMessage = (prefix: string, message: string, data?: unknown): string => {
  const timestamp = new Date().toISOString();
  const dataStr = data !== undefined ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${prefix}] ${message}${dataStr}`;
};

/**
 * 개발 환경에서만 로깅
 */
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  info: (...args: unknown[]) => {
    console.log(...args);
  },
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
  /**
   * 미들웨어 전용 로깅 (Edge Runtime 호환)
   */
  middleware: {
    debug: (message: string, data?: unknown) => {
      if (isDevelopment) {
        console.log(formatMessage('Middleware', message, data));
      }
    },
    info: (message: string, data?: unknown) => {
      console.log(formatMessage('Middleware', message, data));
    },
    warn: (message: string, data?: unknown) => {
      console.warn(formatMessage('Middleware', message, data));
    },
    error: (message: string, data?: unknown) => {
      console.error(formatMessage('Middleware', message, data));
    },
  },
  /**
   * API 전용 로깅
   */
  api: {
    debug: (message: string, data?: unknown) => {
      if (isDevelopment) {
        console.log(formatMessage('API', message, data));
      }
    },
    info: (message: string, data?: unknown) => {
      console.log(formatMessage('API', message, data));
    },
    warn: (message: string, data?: unknown) => {
      console.warn(formatMessage('API', message, data));
    },
    error: (message: string, data?: unknown) => {
      console.error(formatMessage('API', message, data));
    },
  },
  /**
   * 클라이언트 전용 로깅
   */
  client: {
    debug: (message: string, data?: unknown) => {
      if (isDevelopment) {
        console.log(formatMessage('Client', message, data));
      }
    },
    info: (message: string, data?: unknown) => {
      console.log(formatMessage('Client', message, data));
    },
    warn: (message: string, data?: unknown) => {
      console.warn(formatMessage('Client', message, data));
    },
    error: (message: string, data?: unknown) => {
      console.error(formatMessage('Client', message, data));
    },
  },
};
