const puppeteer = require('puppeteer');
const chalk = require('chalk');
const ora = require('ora');
const { handleError, showWarning } = require('./validation');
const { ERROR_MESSAGES, WARNING_MESSAGES } = require('./errors');

// Configure spinner options for Windows compatibility
const spinnerOptions = {
  spinner: {
    interval: 80,
    frames: ['-', '\\', '|', '/']
  }
};

// Device size presets
const deviceSizes = {
  desktop: { width: 1920, height: 1080 },
  laptop: { width: 1366, height: 768 },
  tablet: { width: 768, height: 1024 },
  phone: { width: 375, height: 667 }
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
 * Initialize a Puppeteer browser instance
 * @returns {Promise<Browser>} Puppeteer browser instance
 */
async function initBrowser() {
  const spinner = createSpinner('Launching browser...');
  spinner.start();
  try {
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
    spinner.succeed('Browser launched successfully');
    return browser;
  } catch (error) {
    spinner.fail('Browser launch failed');
    handleError(ERROR_MESSAGES.BROWSER_LAUNCH_FAILED(error.message));
  }
}

/**
 * Sleep for a specified number of milliseconds
 * @param {number} ms - Number of milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Take a screenshot for a specific device size
 * @param {puppeteer.Page} page - Puppeteer page instance
 * @param {string} deviceType - Device type
 * @param {Object} options - Screenshot options
 * @returns {Promise<Buffer>} Screenshot buffer
 */
async function takeDeviceScreenshot(page, deviceType, options = {}) {
  const spinner = createSpinner(`Taking screenshot for ${deviceType}...`);
  spinner.start();
  try {
    const viewport = deviceSizes[deviceType];

    // Check for large viewport
    if (viewport.width * viewport.height > 2073600) { // Greater than 1080p
      showWarning(WARNING_MESSAGES.LARGE_VIEWPORT(deviceType, viewport.width, viewport.height));
    }

    await page.setViewport({
      ...viewport,
      deviceScaleFactor: 1
    });

    // Wait for any animations to settle
    await sleep(500);

    // Convert jpeg to jpg for Puppeteer compatibility
    const format = options.format?.toLowerCase() === 'jpg' || options.format?.toLowerCase() === 'jpeg' ? 'jpeg' : 'png';

    const screenshotOptions = {
      fullPage: options.type === 'full-page',
      type: format,
      quality: format === 'jpeg' ? 80 : undefined,
      optimizeForSpeed: true,
      captureBeyondViewport: options.type === 'full-page'
    };

    const screenshot = await page.screenshot(screenshotOptions);
    spinner.succeed(`Captured ${deviceType} screenshot`);
    return screenshot;
  } catch (error) {
    spinner.fail(`Failed to capture ${deviceType} screenshot`);
    throw error;
  }
}

/**
 * Set up page with common headers and settings
 * @param {puppeteer.Page} page - Puppeteer page instance
 */
async function setupPage(page) {
  // Set a common user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // Set common headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  });

  // Enable JavaScript
  await page.setJavaScriptEnabled(true);
}

/**
 * Take screenshots of a webpage
 * @param {string} url - The URL to screenshot
 * @param {Object} options - Screenshot options
 * @returns {Promise<Object|Buffer>} Screenshot buffer or object containing multiple screenshots
 */
async function takeScreenshot(url, options = {}) {
  let browser;
  const mainSpinner = createSpinner('Starting screenshot process...');
  mainSpinner.start();
  try {
    browser = await initBrowser();
    const page = await browser.newPage();
    await setupPage(page);

    mainSpinner.text = `Loading ${url}...`;
    const response = await page.goto(url, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 30000
    });

    if (!response.ok()) {
      mainSpinner.fail(`Failed to load page: ${response.status()} ${response.statusText()}`);
      handleError(ERROR_MESSAGES.PAGE_LOAD_FAILED(url, response.status(), response.statusText()));
    }

    if (options.wait) {
      const delay = parseFloat(options.wait);
      mainSpinner.text = `Waiting ${delay} seconds for page to settle...`;
      await sleep(delay * 1000);
    }

    mainSpinner.text = 'Preparing page for capture...';
    await page.evaluate(() => new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if(totalHeight >= document.body.scrollHeight){
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 100);
    }));
    await sleep(1000); // Wait for scrolling to settle

    // Take screenshots based on device option
    if (options.device === 'all') {
      mainSpinner.succeed('Page ready for capture');
      const screenshots = {};
      for (const deviceType of Object.keys(deviceSizes)) {
        screenshots[deviceType] = await takeDeviceScreenshot(page, deviceType, options);
      }
      return screenshots;
    } else {
      mainSpinner.succeed('Page ready for capture');
      return await takeDeviceScreenshot(page, options.device || 'desktop', options);
    }
  } catch (error) {
    mainSpinner.fail('Screenshot process failed');
    handleError(error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  initBrowser,
  takeScreenshot,
  deviceSizes
};
