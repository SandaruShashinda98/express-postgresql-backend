const getTimestamp = () => {
  return new Date().toISOString();
};

export const logger = {
  info: (message, meta = {}) => {
    console.log(`[${getTimestamp()}] INFO: ${message}`, meta);
  },

  error: (message, error = {}) => {
    console.error(`[${getTimestamp()}] ERROR: ${message}`, error);
  },

  warn: (message, meta = {}) => {
    console.warn(`[${getTimestamp()}] WARN: ${message}`, meta);
  },

  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[${getTimestamp()}] DEBUG: ${message}`, meta);
    }
  },
};
