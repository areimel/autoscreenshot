const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { handleError } = require('./validation');

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

  const filename = `${hostname}-${device}-${type}-${timestamp}.${format}`;
  console.info(chalk.blue(`Generated filename: ${filename}`));
  return filename;
}

/**
 * Ensure the output directory exists
 * @param {string} dirPath - Directory path
 */
function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      console.info(chalk.blue(`Creating directory: ${dirPath}`));
      fs.mkdirSync(dirPath, { recursive: true });
      console.info(chalk.green('Directory created successfully'));
    } else {
      console.info(chalk.blue(`Directory already exists: ${dirPath}`));
    }
  } catch (error) {
    handleError(`Failed to create directory: ${error.message}`);
  }
}

/**
 * Save a single screenshot to file
 * @param {Buffer} screenshot - Screenshot buffer
 * @param {string} url - The URL that was screenshot
 * @param {string} device - The device type
 * @param {Object} options - Screenshot options
 * @returns {string} Path to saved file
 */
function saveSingleScreenshot(screenshot, url, device, options = {}) {
  try {
    const outputPath = options.output || process.cwd();
    const filename = generateFilename(url, device, options);
    const filepath = path.join(outputPath, filename);

    console.info(chalk.blue(`Saving screenshot to: ${filepath}`));
    fs.writeFileSync(filepath, screenshot);
    console.info(chalk.green('Screenshot saved successfully'));
    
    return filepath;
  } catch (error) {
    handleError(`Failed to save screenshot: ${error.message}`);
  }
}

/**
 * Save screenshot(s) to file
 * @param {Buffer|Object} screenshots - Screenshot buffer or object containing multiple screenshots
 * @param {string} url - The URL that was screenshot
 * @param {Object} options - Screenshot options
 * @returns {string|string[]} Path(s) to saved file(s)
 */
function saveScreenshot(screenshots, url, options = {}) {
  try {
    const outputPath = options.output || process.cwd();
    console.info(chalk.blue(`Using output path: ${outputPath}`));
    ensureDirectoryExists(outputPath);

    // Handle multiple screenshots (all devices)
    if (typeof screenshots === 'object' && !Buffer.isBuffer(screenshots)) {
      const savedPaths = [];
      for (const [device, screenshot] of Object.entries(screenshots)) {
        const filepath = saveSingleScreenshot(screenshot, url, device, options);
        savedPaths.push(filepath);
      }
      return savedPaths;
    }
    
    // Handle single screenshot
    return saveSingleScreenshot(screenshots, url, options.device || 'default', options);
  } catch (error) {
    handleError(`Failed to save screenshot(s): ${error.message}`);
  }
}

module.exports = {
  generateFilename,
  ensureDirectoryExists,
  saveScreenshot
}; 