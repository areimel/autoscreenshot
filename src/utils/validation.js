const chalk = require('chalk');
const { ERROR_TYPES, ERROR_MESSAGES, WARNING_MESSAGES } = require('./errors');

/**
 * Validates a URL string
 * @param {string} url - The URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Validates screenshot type option
 * @param {string} type - The screenshot type
 * @returns {boolean} - Whether the type is valid
 */
function isValidScreenshotType(type) {
  return ['full-page', 'viewport'].includes(type);
}

/**
 * Validates device size option
 * @param {string} device - The device size
 * @returns {boolean} - Whether the device size is valid
 */
function isValidDeviceSize(device) {
  return ['desktop', 'laptop', 'tablet', 'phone', 'all'].includes(device);
}

/**
 * Validates delay time
 * @param {string} delay - The delay time in seconds
 * @returns {boolean} - Whether the delay is valid
 */
function isValidDelay(delay) {
  const delayNum = parseFloat(delay);
  if (!isNaN(delayNum) && delayNum >= 0) {
    // Add warning for long delays
    if (delayNum > 10) {
      showWarning(WARNING_MESSAGES.LONG_DELAY(delayNum));
    }
    return true;
  }
  return false;
}

/**
 * Validates file format
 * @param {string} format - The file format
 * @returns {boolean} - Whether the format is valid
 */
function isValidFormat(format) {
  return ['png', 'jpg', 'jpeg'].includes(format.toLowerCase());
}

/**
 * Shows a warning message
 * @param {Object} warning - Warning message object
 */
function showWarning(warning) {
  console.warn(chalk.bold.yellow(`[WARNING] ${warning.message}`));
}

/**
 * Handles and formats error messages
 * @param {string|Object} error - The error message or object
 * @param {string} [type] - The type of error (if string message provided)
 */
function handleError(error, type = 'error') {
  let errorMessage;
  let errorType;

  if (typeof error === 'string') {
    // Handle legacy string error messages
    errorMessage = error;
    errorType = type;
  } else {
    // Handle new error message objects
    errorMessage = error.message;
    errorType = error.type || ERROR_TYPES.UNKNOWN;
  }

  const prefix = errorType.toUpperCase();
  const formattedMessage = errorMessage.split('\n').join('\n  ');

  switch (errorType) {
    case ERROR_TYPES.VALIDATION:
    case 'error':
      console.error(chalk.bold.red(`[${prefix}] ${formattedMessage}`));
      process.exit(1);
      break;
    case ERROR_TYPES.NETWORK:
    case ERROR_TYPES.BROWSER:
      console.error(chalk.bold.red(`[${prefix}] ${formattedMessage}`));
      process.exit(1);
      break;
    case ERROR_TYPES.FILE_SYSTEM:
    case ERROR_TYPES.SETTINGS:
      console.error(chalk.bold.red(`[${prefix}] ${formattedMessage}`));
      if (type !== 'warning') {
        process.exit(1);
      }
      break;
    case 'warning':
      console.warn(chalk.bold.yellow(`[${prefix}] ${formattedMessage}`));
      break;
    case 'info':
      console.info(chalk.bold.blue(`[${prefix}] ${formattedMessage}`));
      break;
    default:
      console.error(chalk.bold.red(`[ERROR] ${formattedMessage}`));
      process.exit(1);
  }
}

module.exports = {
  isValidUrl,
  isValidScreenshotType,
  isValidDeviceSize,
  isValidDelay,
  isValidFormat,
  handleError,
  showWarning
};
