export const logger = {
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};
