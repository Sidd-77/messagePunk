// src/utils/logger.ts
import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Configure logger
const logger = winston.createLogger({
  level: "info",
  format: combine(
    colorize(), // Colorize log levels (for console only)
    timestamp(), // Add timestamp
    errors({ stack: true }), // Include stack trace for errors
    logFormat, // Use custom format
  ),
  transports: [
    new winston.transports.Console(), // Log to console
  ],
});

export default logger;
