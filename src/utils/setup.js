const chalk = require('chalk');
const inquirer = require('inquirer');
const path = require('path');
const { loadSettings, saveSettings, getSettingsPath } = require('./settings');
const fs = require('fs');

/**
 * Validate settings input
 * @param {Object} input - User input to validate
 * @returns {Object} Validation result with valid flag and error messages
 */
function validateInput(input) {
  const errors = [];

  // Validate JPG quality
  if (input.defaultFormat === 'jpg') {
    if (input.jpgQuality < 1 || input.jpgQuality > 100) {
      errors.push('JPEG quality must be between 1 and 100');
    }
  }

  // Validate delay
  if (input.defaultDelay < 0) {
    errors.push('Delay must be non-negative');
  }

  // Validate output path
  if (input.outputPath) {
    try {
      path.resolve(input.outputPath);
    } catch (error) {
      errors.push('Invalid output path');
    }
  }

  // Validate device selection
  if (!input.enabledDevices || input.enabledDevices.length === 0) {
    errors.push('At least one device must be enabled');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Run the first-time setup workflow
 * @returns {Promise<void>}
 */
async function runSetup() {
  console.info(chalk.blue('\nWelcome to AutoScreenshot Setup! 🚀'));
  console.info(chalk.gray('Let\'s configure your default settings.\n'));

  try {
    // Load current settings as base
    const settings = await loadSettings();

    // Get user preferences
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'defaultFormat',
        message: 'Choose your default screenshot format:',
        choices: ['jpg', 'png'],
        default: settings.defaults.format.type
      },
      {
        type: 'number',
        name: 'jpgQuality',
        message: 'Set JPEG quality (1-100):',
        default: settings.defaults.format.jpgQuality,
        when: (answers) => answers.defaultFormat === 'jpg',
        validate: (value) => value >= 1 && value <= 100 || 'Quality must be between 1 and 100'
      },
      {
        type: 'input',
        name: 'outputPath',
        message: 'Set default screenshot output directory (leave empty for current directory):',
        default: settings.defaults.fileDestination.path,
        filter: (input) => input.trim()
      },
      {
        type: 'confirm',
        name: 'createTimestampFolders',
        message: 'Create date-based folders for screenshots?',
        default: settings.defaults.fileDestination.createTimestampFolders
      },
      {
        type: 'number',
        name: 'defaultDelay',
        message: 'Set default delay before taking screenshots (seconds):',
        default: settings.defaults.delay.seconds,
        validate: (value) => value >= 0 || 'Delay must be non-negative'
      },
      {
        type: 'checkbox',
        name: 'enabledDevices',
        message: 'Select devices to enable:',
        choices: [
          { name: 'Desktop (1920x1080)', value: 'desktop', checked: settings.devices.desktop.enabled },
          { name: 'Laptop (1366x768)', value: 'laptop', checked: settings.devices.laptop.enabled },
          { name: 'Tablet (768x1024)', value: 'tablet', checked: settings.devices.tablet.enabled },
          { name: 'Phone (375x667)', value: 'phone', checked: settings.devices.phone.enabled }
        ],
        validate: (value) => value.length > 0 || 'At least one device must be enabled'
      },
      {
        type: 'confirm',
        name: 'verboseLogging',
        message: 'Enable verbose logging?',
        default: settings.interface.verboseLogging
      }
    ]);

    // Validate input
    const validation = validateInput(answers);
    if (!validation.valid) {
      throw new Error('Invalid settings: ' + validation.errors.join(', '));
    }

    // Update settings with user preferences
    settings.defaults.format.type = answers.defaultFormat;
    if (answers.defaultFormat === 'jpg') {
      settings.defaults.format.jpgQuality = answers.jpgQuality;
    }
    settings.defaults.fileDestination.path = answers.outputPath;
    settings.defaults.fileDestination.createTimestampFolders = answers.createTimestampFolders;
    settings.defaults.delay.seconds = answers.defaultDelay;

    // Update device settings
    Object.keys(settings.devices).forEach(device => {
      if (device !== 'custom') {
        settings.devices[device].enabled = answers.enabledDevices.includes(device);
      }
    });

    settings.interface.verboseLogging = answers.verboseLogging;

    // Save updated settings
    await saveSettings(settings);

    console.info(chalk.green('\n✨ Setup complete! Your settings have been saved to:'));
    console.info(chalk.blue(getSettingsPath()));

    console.info(chalk.gray('\nYou can modify these settings at any time with:'));
    console.info(chalk.white('autoscreenshot settings --show    # View current settings'));
    console.info(chalk.white('autoscreenshot settings --init    # Reinitialize settings'));
    console.info(chalk.white('autoscreenshot settings --reset   # Reset to defaults'));

    console.info(chalk.blue('\nTry taking your first screenshot:'));
    console.info(chalk.white('autoscreenshot example.com'));

  } catch (error) {
    console.error(chalk.red('Setup failed:'), error.message);
    throw error;
  }
}

/**
 * Check if this is the first time running the tool
 * @returns {Promise<boolean>}
 */
async function isFirstRun() {
  try {
    const settingsPath = getSettingsPath();
    return !fs.existsSync(settingsPath);
  } catch (error) {
    // If we can't check the settings path, assume it's a first run
    return true;
  }
}

module.exports = {
  runSetup,
  isFirstRun,
  validateInput // Export for testing
};
