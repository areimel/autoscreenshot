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
const { isFirstRun, runSetup } = require('../src/utils/setup');
const path = require('path');

// Check for first run
(async () => {
  try {
    if (await isFirstRun()) {
      await runSetup();
      process.exit(0);
    }
  } catch (error) {
    handleError('Failed to check first run status: ' + error.message);
  }
})();

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
  .option('-p, --preset <name>', 'use a predefined preset from settings')
  .action(async (url, options) => {
    try {
      if (url) {
        const { getPreset } = require('../src/utils/settings');
        let finalOptions = { ...options };

        // Apply preset if specified
        if (options.preset) {
          const preset = await getPreset(options.preset);
          if (!preset) {
            handleError(`Preset not found: ${options.preset}`);
          }
          console.info(chalk.blue(`Using preset: ${options.preset}`));
          console.info(chalk.gray(`Description: ${preset.description}`));

          // Merge preset options with command line options (command line takes precedence)
          finalOptions = {
            ...preset,
            ...options,
            preset: undefined // Remove preset from options to avoid confusion
          };
        }

        // Validate URL
        if (!isValidUrl(url)) {
          handleError(`Invalid URL: ${url}`);
        }

        // Validate screenshot type
        if (finalOptions.type && !isValidScreenshotType(finalOptions.type)) {
          handleError(`Invalid screenshot type: ${finalOptions.type}. Must be either 'full-page' or 'viewport'`);
        }

        // Validate device size
        if (finalOptions.device && !isValidDeviceSize(finalOptions.device)) {
          handleError(`Invalid device size: ${finalOptions.device}. Must be one of: desktop, laptop, tablet, phone, or all`);
        }

        // Validate delay
        if (finalOptions.wait && !isValidDelay(finalOptions.wait)) {
          handleError(`Invalid delay time: ${finalOptions.wait}. Must be a positive number`);
        }

        // Validate format
        if (finalOptions.format && !isValidFormat(finalOptions.format)) {
          handleError(`Invalid file format: ${finalOptions.format}. Must be either 'png' or 'jpg'`);
        }

        console.info(chalk.blue('Starting screenshot process...'));

        // Take screenshot(s)
        const screenshots = await takeScreenshot(url, finalOptions);

        // Save screenshot(s)
        const savedPaths = await saveScreenshot(screenshots, url, finalOptions);

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

// Settings command
program
  .command('settings')
  .description('Manage autoscreenshot settings')
  .option('-p, --path <path>', 'Path to custom settings file')
  .option('-s, --show', 'Show current settings')
  .option('-r, --reset', 'Reset settings to defaults')
  .option('-i, --init', 'Initialize settings file in current directory')
  .option('--setup', 'Run the interactive setup workflow')
  .action(async (options) => {
    try {
      const {
        loadSettings,
        saveSettings,
        initSettings,
        setSettingsPath,
        getSettingsPath,
        resetSettings
      } = require('../src/utils/settings');

      if (options.setup) {
        await runSetup();
        return;
      }

      if (options.path) {
        // Set custom settings file path
        const resolvedPath = path.resolve(options.path);
        setSettingsPath(resolvedPath);
        console.info(chalk.blue(`Settings file path set to: ${resolvedPath}`));

        // Try to load the settings to validate them
        try {
          await loadSettings();
          console.info(chalk.green('Settings file loaded successfully'));
        } catch (error) {
          console.warn(chalk.yellow(`Warning: Could not load settings from ${resolvedPath}`));
          console.info(chalk.blue('A new settings file will be created when needed'));
        }
      }

      if (options.show) {
        // Show current settings
        const settings = await loadSettings();
        console.info(chalk.blue('\nCurrent Settings:'));
        console.info(chalk.blue('Settings file location:'), getSettingsPath());
        console.info(JSON.stringify(settings, null, 2));
      }

      if (options.reset) {
        // Reset settings to defaults
        await resetSettings();
        console.info(chalk.green('Settings reset to defaults'));
      }

      if (options.init) {
        // Initialize settings in current directory
        const settingsPath = path.join(process.cwd(), 'settings.json');
        await initSettings(settingsPath);
        console.info(chalk.green(`Settings file initialized at: ${settingsPath}`));
      }

      // If no options provided, show help
      if (!options.path && !options.show && !options.reset && !options.init) {
        program.commands.find(c => c.name() === 'settings').help();
      }
    } catch (error) {
      handleError(`Failed to manage settings: ${error.message}`);
    }
  });

// Presets command
program
  .command('presets')
  .description('List available screenshot presets')
  .action(async () => {
    try {
      const { loadSettings } = require('../src/utils/settings');
      const settings = await loadSettings();

      console.info(chalk.blue('\nAvailable Presets:'));
      console.info(chalk.gray('----------------'));

      Object.entries(settings.presets).forEach(([name, preset]) => {
        console.info(chalk.green(`\n${name}:`));
        console.info(chalk.gray(`Description: ${preset.description}`));
        console.info(chalk.gray('Settings:'));
        Object.entries(preset).forEach(([key, value]) => {
          if (key !== 'description') {
            console.info(chalk.gray(`  ${key}: ${value}`));
          }
        });
      });

      console.info(chalk.blue('\nTo use a preset:'));
      console.info('autoscreenshot <url> --preset <preset-name>');
    } catch (error) {
      handleError(`Failed to list presets: ${error.message}`);
    }
  });

program.parse();
