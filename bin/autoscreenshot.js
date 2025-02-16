#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const package = require('../package.json');
const {
  isValidUrl,
  isValidScreenshotType,
  isValidDeviceSize,
  isValidDelay,
  isValidFormat,
  handleError
} = require('../src/utils/validation');
const { takeScreenshot } = require('../src/utils/browser');
const { saveScreenshot } = require('../src/utils/file');

// Set up the program
program
  .name('autoscreenshot')
  .description('A CLI tool for taking automated screenshots of web pages')
  .version(package.version);

// Default command (no arguments)
program
  .action(() => {
    if (process.argv.length === 2) {
      console.info(chalk.blue('Welcome to AutoScreenshot!'));
      console.info('To get started, run: autoscreenshot <url>');
      console.info('\nFor help, run: autoscreenshot --help');
    }
  });

// URL command
program
  .argument('[url]', 'URL to take screenshot of')
  .option('-t, --type <type>', 'screenshot type (full-page or viewport)')
  .option('-d, --device <device>', 'device size (desktop, laptop, tablet, phone, or all)')
  .option('-w, --wait <seconds>', 'delay before taking screenshot')
  .option('-f, --format <format>', 'file format (png or jpg)')
  .option('-o, --output <path>', 'output file destination')
  .action(async (url, options) => {
    try {
      if (url) {
        // Validate URL
        if (!isValidUrl(url)) {
          handleError(`Invalid URL: ${url}`);
        }

        // Validate screenshot type
        if (options.type && !isValidScreenshotType(options.type)) {
          handleError(`Invalid screenshot type: ${options.type}. Must be either 'full-page' or 'viewport'`);
        }

        // Validate device size
        if (options.device && !isValidDeviceSize(options.device)) {
          handleError(`Invalid device size: ${options.device}. Must be one of: desktop, laptop, tablet, phone, or all`);
        }

        // Validate delay
        if (options.wait && !isValidDelay(options.wait)) {
          handleError(`Invalid delay time: ${options.wait}. Must be a positive number`);
        }

        // Validate format
        if (options.format && !isValidFormat(options.format)) {
          handleError(`Invalid file format: ${options.format}. Must be either 'png' or 'jpg'`);
        }

        console.info(chalk.blue('Starting screenshot process...'));

        // Take screenshot(s)
        const screenshots = await takeScreenshot(url, options);
        
        // Save screenshot(s)
        const savedPaths = await saveScreenshot(screenshots, url, options);
        
        // Display results
        if (Array.isArray(savedPaths)) {
          console.info(chalk.green('\nAll screenshots saved successfully:'));
          savedPaths.forEach(path => {
            console.info(chalk.green(`- ${path}`));
          });
        } else {
          console.info(chalk.green(`\nScreenshot saved successfully to: ${savedPaths}`));
        }
      }
    } catch (error) {
      handleError(`An unexpected error occurred: ${error.message}`);
    }
  });

// Batch mode command
program
  .command('batch')
  .description('Process multiple URLs from a JSON or CSV file')
  .action(() => {
    handleError('Batch mode is not implemented yet', 'warning');
  });

// Accessibility mode command
program
  .command('accessibility')
  .description('Take screenshots with accessibility filters')
  .action(() => {
    handleError('Accessibility mode is not implemented yet', 'warning');
  });

program.parse(); 