#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
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
  .description(`
  A powerful CLI tool for taking automated screenshots of web pages.

  Examples:
    $ autoscreenshot                          # Start interactive mode
    $ autoscreenshot https://example.com      # Interactive mode with pre-filled URL
    $ autoscreenshot capture example.com      # Quick capture with defaults
    $ autoscreenshot capture example.com -d all    # Capture for all devices
  `)
  .version(package.version);

// Interactive command (default when no arguments)
program
  .command('interactive [url]', { isDefault: true })
  .description('Start interactive mode with step-by-step prompts')
  .usage('[url] [options]')
  .addHelpText('after', `
  Examples:
    $ autoscreenshot                     # Start interactive mode
    $ autoscreenshot https://example.com # Pre-fill URL in interactive mode
  `)
  .action(async (url) => {
    console.info(chalk.blue('Welcome to AutoScreenshot! 📸'));
    console.info(chalk.gray('Interactive Mode\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'url',
        message: 'Enter the URL to screenshot:',
        default: url || undefined,
        validate: (input) => isValidUrl(input) || 'Please enter a valid URL'
      },
      {
        type: 'list',
        name: 'type',
        message: 'Choose screenshot type:',
        choices: ['full-page', 'viewport'],
        default: 'full-page'
      },
      {
        type: 'list',
        name: 'device',
        message: 'Choose device size:',
        choices: ['desktop', 'laptop', 'tablet', 'phone', 'all'],
        default: 'desktop'
      },
      {
        type: 'input',
        name: 'wait',
        message: 'Delay before screenshot (seconds):',
        default: '0',
        validate: (input) => isValidDelay(input) || 'Please enter a valid delay time'
      },
      {
        type: 'list',
        name: 'format',
        message: 'Choose file format:',
        choices: ['png', 'jpg'],
        default: 'png'
      }
    ]);

    try {
      console.info(chalk.blue('\nStarting screenshot process...'));
      console.info(chalk.gray('URL:', answers.url));
      console.info(chalk.gray('Type:', answers.type));
      console.info(chalk.gray('Device:', answers.device));
      console.info(chalk.gray('Delay:', answers.wait, 'seconds'));
      console.info(chalk.gray('Format:', answers.format));

      // Take screenshot(s)
      const screenshots = await takeScreenshot(answers.url, answers);

      // Save screenshot(s)
      const savedPaths = await saveScreenshot(screenshots, answers.url, answers);

      // Display results
      if (Array.isArray(savedPaths)) {
        console.info(chalk.green('\n✨ All screenshots saved successfully:'));
        savedPaths.forEach(path => {
          console.info(chalk.green(`  ✓ ${path}`));
        });
      } else {
        console.info(chalk.green(`\n✨ Screenshot saved successfully to:\n  ✓ ${savedPaths}`));
      }
    } catch (error) {
      handleError(`An unexpected error occurred: ${error.message}`);
    }
  });

// URL command
program
  .command('capture [url]')
  .description('Quickly capture screenshots with optional parameters')
  .usage('[url] [options]')
  .option('-t, --type <type>', 'screenshot type: full-page or viewport', 'full-page')
  .option('-d, --device <device>', 'device size: desktop, laptop, tablet, phone, or all', 'desktop')
  .option('-w, --wait <seconds>', 'delay before capture in seconds', '0')
  .option('-f, --format <format>', 'file format: png or jpg', 'png')
  .option('-o, --output <path>', 'custom output directory')
  .option('-p, --preset <name>', 'use a predefined preset from settings')
  .addHelpText('after', `
  Examples:
    $ autoscreenshot capture example.com                    # Basic capture
    $ autoscreenshot capture example.com -d all            # Capture all device sizes
    $ autoscreenshot capture example.com -t viewport       # Capture viewport only
    $ autoscreenshot capture example.com -w 5              # Wait 5 seconds before capture
    $ autoscreenshot capture example.com -p blog-preset    # Use a preset
  `)
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

// Settings command
program
  .command('settings')
  .description('Manage application settings and presets')
  .option('-p, --path <path>', 'set custom settings file path')
  .option('-s, --show', 'display current settings')
  .option('-r, --reset', 'reset settings to defaults')
  .option('-i, --init', 'initialize settings file in current directory')
  .option('--setup', 'run the interactive setup workflow')
  .addHelpText('after', `
  Examples:
    $ autoscreenshot settings --show           # View current settings
    $ autoscreenshot settings --reset          # Reset to defaults
    $ autoscreenshot settings --setup          # Run setup wizard
    $ autoscreenshot settings -i               # Create settings file here
  `)
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
  .description('List and manage screenshot presets')
  .addHelpText('after', `
  Examples:
    $ autoscreenshot presets                   # List all presets
    $ autoscreenshot capture example.com -p blog    # Use 'blog' preset
  `)
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

// Batch mode command
program
  .command('batch')
  .description('Process multiple URLs from a JSON or CSV file (Coming Soon)')
  .action(() => {
    handleError('Batch mode is not implemented yet', 'warning');
  });

// Accessibility mode command
program
  .command('accessibility')
  .description('Take screenshots with accessibility filters (Coming Soon)')
  .action(() => {
    handleError('Accessibility mode is not implemented yet', 'warning');
  });

// Add global help text
program.addHelpText('beforeAll', `
AutoScreenshot CLI ${package.version}
A powerful tool for capturing web screenshots across different devices and formats.
`);

program.addHelpText('afterAll', `
For more information and examples, visit:
https://github.com/yourusername/autoscreenshot#readme
`);

program.parse();
