'use strict';

/**
 * Simple logger utility with different log levels
 * In a production environment, this would be replaced with a more robust logging solution
 * like Winston, Pino, or a cloud logging service
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Set default log level based on environment
const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.INFO 
  : LOG_LEVELS.DEBUG;

// Current log level - can be changed at runtime
let currentLogLevel = process.env.LOG_LEVEL 
  ? parseInt(process.env.LOG_LEVEL, 10) 
  : DEFAULT_LOG_LEVEL;

/**
 * Format log message with timestamp and additional metadata
 */
function formatLogMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const formattedMeta = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${formattedMeta}`;
}

/**
 * Logger methods for different log levels
 */
export const logger = {
  // Set the log level
  setLogLevel: (level) => {
    if (Object.values(LOG_LEVELS).includes(level)) {
      currentLogLevel = level;
      logger.info(`Log level set to ${Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === level)}`);
    } else {
      logger.error(`Invalid log level: ${level}`);
    }
  },
  
  // Error logs - always enabled
  error: (message, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(formatLogMessage('ERROR', message, meta));
    }
  },
  
  // Warning logs
  warn: (message, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(formatLogMessage('WARN', message, meta));
    }
  },
  
  // Info logs
  info: (message, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.info(formatLogMessage('INFO', message, meta));
    }
  },
  
  // Debug logs - for development
  debug: (message, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.debug(formatLogMessage('DEBUG', message, meta));
    }
  },
  
  // Log levels for reference
  levels: LOG_LEVELS
}; 