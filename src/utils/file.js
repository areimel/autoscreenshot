const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { handleError } = require('./validation');
const { loadSettings } = require('./settings');
const { ERROR_MESSAGES } = require('./errors');

// Configure spinner options for Windows compatibility
const spinnerOptions = {
  spinner: {
    interval: 80,
    frames: ['-', '\\', '|', '/']
  }
};

/**
 * Create a new spinner with the given text
 * @param {string} text - The spinner text
 * @returns {ora.Ora} A new spinner instance
 */
function createSpinner(text) {
  return ora({ ...spinnerOptions, text });
}

/**
 * Get the base output directory
 * @param {Object} options - Screenshot options
 * @returns {Promise<string>} Base output directory path
 */
async function getBaseOutputDir(options = {}) {
  try {
    const settings = await loadSettings();
    const fileDestination = settings.defaults.fileDestination;
    let baseDir = options.output || fileDestination.path || process.cwd();

    if (fileDestination.createTimestampFolders) {
      const timestamp = new Date().toISOString().split('T')[0];
      baseDir = path.join(baseDir, timestamp);
    }

    return baseDir;
  } catch (error) {
    handleError(ERROR_MESSAGES.SETTINGS_LOAD_FAILED(error.message));
  }
}

/**
 * Generate a filename for the screenshot
 * @param {string} url - The URL that was screenshot
 * @param {string} device - The device type
 * @param {Object} options - Screenshot options
 * @returns {string} Generated filename
 */
function generateFilename(url, device, options = {}) {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.replace(/[^a-z0-9]/gi, '-');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const type = options.type || 'default';
  const format = options.format || 'jpg';

  return `${hostname}-${device}-${type}-${timestamp}.${format}`;
}

/**
 * Ensure the output directory exists
 * @param {string} dirPath - Directory path
 */
function ensureDirectoryExists(dirPath) {
  const spinner = createSpinner(`Preparing directory: ${dirPath}`);
  spinner.start();
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      spinner.succeed(`Created directory: ${dirPath}`);
    } else {
      spinner.succeed(`Using existing directory: ${dirPath}`);
    }
  } catch (error) {
    spinner.fail(`Failed to prepare directory: ${dirPath}`);
    handleError(ERROR_MESSAGES.DIRECTORY_CREATE_FAILED(dirPath, error.message));
  }
}

/**
 * Save a single screenshot to file
 * @param {Buffer} screenshot - Screenshot buffer
 * @param {string} url - The URL that was screenshot
 * @param {string} device - The device type
 * @param {Object} options - Screenshot options
 * @returns {Promise<string>} Path to saved file
 */
async function saveSingleScreenshot(screenshot, url, device, options = {}) {
  try {
    const baseDir = await getBaseOutputDir(options);
    const outputPath = options.device === 'all' ?
      path.join(baseDir, device) : baseDir;

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    const filename = generateFilename(url, device, options);
    const filepath = path.join(outputPath, filename);
    fs.writeFileSync(filepath, screenshot);
    return filepath;
  } catch (error) {
    handleError(ERROR_MESSAGES.SAVE_SCREENSHOT_FAILED(filepath || 'unknown', error.message));
  }
}

/**
 * Save screenshot(s) to file
 * @param {Buffer|Object} screenshots - Screenshot buffer or object containing multiple screenshots
 * @param {string} url - The URL that was screenshot
 * @param {Object} options - Screenshot options
 * @returns {Promise<string|string[]>} Path(s) to saved file(s)
 */
async function saveScreenshot(screenshots, url, options = {}) {
  const mainSpinner = createSpinner('Saving screenshots...');
  mainSpinner.start();
  try {
    // Handle multiple screenshots (all devices)
    if (typeof screenshots === 'object' && !Buffer.isBuffer(screenshots)) {
      const savedPaths = [];
      const totalScreenshots = Object.keys(screenshots).length;

      for (const [device, screenshot] of Object.entries(screenshots)) {
        const filepath = await saveSingleScreenshot(screenshot, url, device, options);
        savedPaths.push(filepath);
        mainSpinner.text = `Saving screenshots... (${savedPaths.length}/${totalScreenshots})`;
      }

      mainSpinner.succeed(`✨ All ${savedPaths.length} screenshots saved successfully`);
      return savedPaths;
    }

    // Handle single screenshot
    const result = await saveSingleScreenshot(screenshots, url, options.device || 'default', options);
    mainSpinner.succeed('✨ Screenshot saved successfully');
    return result;
  } catch (error) {
    mainSpinner.fail('Failed to save screenshots');
    handleError(error.message);
  }
}

module.exports = {
  generateFilename,
  ensureDirectoryExists,
  saveScreenshot,
  getBaseOutputDir
};
