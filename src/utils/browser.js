const puppeteer = require('puppeteer');
const chalk = require('chalk');
const { handleError } = require('./validation');

// Device size presets
const deviceSizes = {
  desktop: { width: 1920, height: 1080 },
  laptop: { width: 1366, height: 768 },
  tablet: { width: 768, height: 1024 },
  phone: { width: 375, height: 667 }
};

/**
 * Initialize a Puppeteer browser instance
 * @returns {Promise<Browser>} Puppeteer browser instance
 */
async function initBrowser() {
  try {
    console.info(chalk.blue('Launching browser...'));
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
    console.info(chalk.green('Browser launched successfully'));
    return browser;
  } catch (error) {
    handleError(`Failed to launch browser: ${error.message}`);
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
  console.info(chalk.blue(`Setting viewport size for ${deviceType}...`));
  await page.setViewport({
    ...deviceSizes[deviceType],
    deviceScaleFactor: 1
  });

  // Wait for any animations to settle
  await sleep(500);

  const screenshotOptions = {
    fullPage: options.type === 'full-page',
    type: options.format?.toLowerCase() || 'jpeg',
    quality: options.format?.toLowerCase() === 'jpeg' ? 80 : undefined,
    optimizeForSpeed: true,
    captureBeyondViewport: options.type === 'full-page'
  };

  console.info(chalk.blue(`Taking screenshot for ${deviceType}...`));
  return await page.screenshot(screenshotOptions);
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
  try {
    browser = await initBrowser();
    const page = await browser.newPage();
    
    // Set up page with common headers and settings
    await setupPage(page);

    // Navigate to URL with improved error handling
    console.info(chalk.blue(`Navigating to ${url}...`));
    const response = await page.goto(url, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 30000
    });

    if (!response.ok()) {
      throw new Error(`Failed to load page: ${response.status()} ${response.statusText()}`);
    }

    // Wait for specified delay
    if (options.wait) {
      const delay = parseFloat(options.wait);
      console.info(chalk.blue(`Waiting for ${delay} seconds...`));
      await sleep(delay * 1000);
    }

    // Additional wait for dynamic content
    console.info(chalk.blue('Waiting for dynamic content to load...'));
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
      const screenshots = {};
      for (const deviceType of Object.keys(deviceSizes)) {
        screenshots[deviceType] = await takeDeviceScreenshot(page, deviceType, options);
        console.info(chalk.green(`Screenshot captured successfully for ${deviceType}`));
      }
      return screenshots;
    } else {
      const screenshot = await takeDeviceScreenshot(page, options.device || 'desktop', options);
      console.info(chalk.green('Screenshot captured successfully'));
      return screenshot;
    }
  } catch (error) {
    handleError(`Failed to take screenshot: ${error.message}`);
  } finally {
    if (browser) {
      console.info(chalk.blue('Closing browser...'));
      await browser.close();
    }
  }
}

module.exports = {
  initBrowser,
  takeScreenshot,
  deviceSizes
}; 