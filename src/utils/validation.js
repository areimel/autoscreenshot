const chalk = require('chalk');

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
  return !isNaN(delayNum) && delayNum >= 0;
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
 * Handles and formats error messages
 * @param {string} message - The error message
 * @param {string} type - The type of error
 */
function handleError(message, type = 'error') {
  const prefix = type.toUpperCase();
  
  switch (type) {
    case 'error':
      console.error(chalk.bold.red(`[${prefix}] ${message}`));
      process.exit(1);
      break;
    case 'warning':
      console.warn(chalk.bold.yellow(`[${prefix}] ${message}`));
      break;
    case 'info':
      console.info(chalk.bold.blue(`[${prefix}] ${message}`));
      break;
    default:
      console.log(chalk.white(message));
  }
}

module.exports = {
  isValidUrl,
  isValidScreenshotType,
  isValidDeviceSize,
  isValidDelay,
  isValidFormat,
  handleError
}; 