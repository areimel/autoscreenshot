const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const os = require('os');

// Default settings object that matches settings.json structure
const defaultSettings = {
  version: '1.0.0',
  defaults: {
    format: {
      type: 'jpg',
      skipPrompt: false,
      jpgQuality: 80
    },
    delay: {
      seconds: 1.5,
      skipPrompt: false
    },
    fileDestination: {
      path: '',
      skipPrompt: false,
      createTimestampFolders: false
    }
  },
  devices: {
    desktop: {
      width: 1920,
      height: 1080,
      enabled: true
    },
    laptop: {
      width: 1366,
      height: 768,
      enabled: true
    },
    tablet: {
      width: 768,
      height: 1024,
      enabled: true
    },
    phone: {
      width: 375,
      height: 667,
      enabled: true
    },
    custom: {
      largeDisplay: {
        width: 2400,
        height: 1600,
        enabled: false
      }
    }
  },
  presets: {
    mobile: {
      description: 'Mobile-only viewport screenshot',
      device: 'phone',
      type: 'viewport',
      format: 'jpg'
    },
    fullpage: {
      description: 'Full-page screenshot for all devices',
      device: 'all',
      type: 'full-page',
      format: 'png',
      delay: 2
    }
  },
  interface: {
    showProgressBar: true,
    colorOutput: true,
    verboseLogging: false
  },
  batch: {
    defaultOutputFolder: 'autoscreenshot-batch',
    includeTimestamp: true,
    maxConcurrent: 3
  }
};

// Settings path management
let customSettingsPath = null;

/**
 * Get the default settings path
 * @returns {string} Default settings path
 */
function getDefaultSettingsPath() {
  // Use platform-specific paths
  if (process.platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Local', 'autoscreenshot', 'settings.json');
  }
  return path.join(os.homedir(), '.config', 'autoscreenshot', 'settings.json');
}

/**
 * Validate settings path
 * @param {string} filepath - Path to validate
 * @returns {boolean} Whether the path is valid
 */
function isValidSettingsPath(filepath) {
  try {
    // Check if path is absolute
    const absolutePath = path.resolve(filepath);

    // Check if directory is writable
    const dir = path.dirname(absolutePath);
    fs.accessSync(dir, fs.constants.W_OK);

    // Check file extension
    if (path.extname(filepath) !== '.json') {
      throw new Error('Settings file must have .json extension');
    }

    return true;
  } catch (error) {
    console.error(chalk.red(`Invalid settings path: ${error.message}`));
    return false;
  }
}

/**
 * Validate settings content
 * @param {Object} settings - Settings object to validate
 * @returns {Object} Object containing validation result and errors
 */
function validateSettings(settings) {
  const errors = [];

  // Check if settings is an object
  if (!settings || typeof settings !== 'object') {
    return { valid: false, errors: ['Settings must be an object'] };
  }

  // Check version
  if (!settings.version) {
    errors.push('Missing version field');
  }

  // Check required sections
  const requiredSections = ['defaults', 'devices', 'presets', 'interface', 'batch'];
  requiredSections.forEach(section => {
    if (!settings[section]) {
      errors.push(`Missing ${section} section`);
    }
  });

  // Validate devices
  if (settings.devices) {
    const requiredDevices = ['desktop', 'laptop', 'tablet', 'phone'];
    requiredDevices.forEach(device => {
      if (!settings.devices[device]) {
        errors.push(`Missing ${device} configuration`);
      } else {
        const config = settings.devices[device];
        if (typeof config.width !== 'number' || config.width <= 0) {
          errors.push(`Invalid width for ${device}`);
        }
        if (typeof config.height !== 'number' || config.height <= 0) {
          errors.push(`Invalid height for ${device}`);
        }
        if (typeof config.enabled !== 'boolean') {
          errors.push(`Missing enabled flag for ${device}`);
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Set a custom settings file path
 * @param {string} filepath - Path to settings file
 * @throws {Error} If path is invalid
 */
function setSettingsPath(filepath) {
  if (!isValidSettingsPath(filepath)) {
    throw new Error('Invalid settings file path');
  }
  customSettingsPath = filepath;
}

/**
 * Get the current settings file path
 * @returns {string} Path to settings file
 */
function getSettingsPath() {
  return customSettingsPath || getDefaultSettingsPath();
}

/**
 * Initialize settings file at specified location
 * @param {string} [filepath] - Optional path to initialize settings
 * @returns {Promise<void>}
 */
async function initSettings(filepath = null) {
  const settingsPath = filepath || getSettingsPath();
  const settingsDir = path.dirname(settingsPath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, { recursive: true });
  }

  // Write default settings
  await saveSettings(defaultSettings, settingsPath);
}

/**
 * Reset settings to defaults
 * @returns {Promise<void>}
 */
async function resetSettings() {
  await saveSettings(defaultSettings);
}

/**
 * Check if settings file exists
 * @returns {boolean} Whether settings file exists
 */
function settingsExist() {
  try {
    return fs.existsSync(getSettingsPath());
  } catch (error) {
    console.info(chalk.yellow('No settings file found'));
    return false;
  }
}

/**
 * Load settings from file
 * @returns {Promise<Object>} Settings object
 */
async function loadSettings() {
  try {
    if (!settingsExist()) {
      console.info(chalk.yellow('Creating default settings file...'));
      await initSettings();
      return defaultSettings;
    }

    const settings = JSON.parse(fs.readFileSync(getSettingsPath(), 'utf8'));
    return validateAndUpdateSettings(settings);
  } catch (error) {
    console.error(chalk.red(`Failed to load settings: ${error.message}`));
    console.info(chalk.yellow('Falling back to default settings...'));
    return defaultSettings;
  }
}

/**
 * Save settings to file
 * @param {Object} settings - Settings object to save
 * @param {string} [filepath] - Optional path to save settings
 * @returns {Promise<void>}
 */
async function saveSettings(settings, filepath = null) {
  try {
    const validation = validateSettings(settings);
    if (!validation.valid) {
      throw new Error(`Invalid settings: ${validation.errors.join(', ')}`);
    }

    const settingsPath = filepath || getSettingsPath();
    const settingsDir = path.dirname(settingsPath);

    // Ensure directory exists
    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, { recursive: true });
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.info(chalk.green('Settings saved successfully'));
  } catch (error) {
    console.error(chalk.red(`Failed to save settings: ${error.message}`));
    throw error;
  }
}

/**
 * Validate and update settings object
 * @param {Object} settings - Settings object to validate
 * @returns {Object} Validated and updated settings
 */
function validateAndUpdateSettings(settings) {
  const validated = { ...defaultSettings };

  // Recursively merge settings, keeping default values for missing properties
  function mergeSettings(target, source) {
    Object.keys(target).forEach(key => {
      if (source[key] !== undefined) {
        if (typeof target[key] === 'object' && !Array.isArray(target[key])) {
          target[key] = mergeSettings({ ...target[key] }, source[key]);
        } else {
          target[key] = source[key];
        }
      }
    });
    return target;
  }

  return mergeSettings(validated, settings);
}

/**
 * Get a specific preset configuration
 * @param {string} presetName - Name of the preset
 * @returns {Object|null} Preset configuration or null if not found
 */
function getPreset(presetName) {
  const settings = loadSettings();
  return settings.presets[presetName] || null;
}

/**
 * Get enabled device configurations
 * @returns {Object} Object containing enabled device configurations
 */
function getEnabledDevices() {
  const settings = loadSettings();
  const enabledDevices = {};

  // Add standard devices
  Object.entries(settings.devices).forEach(([name, config]) => {
    if (name !== 'custom' && config.enabled) {
      enabledDevices[name] = config;
    }
  });

  // Add custom devices
  Object.entries(settings.devices.custom).forEach(([name, config]) => {
    if (config.enabled) {
      enabledDevices[name] = config;
    }
  });

  return enabledDevices;
}

/**
 * Get default settings for a specific category
 * @param {string} category - Category of defaults to get
 * @returns {Object} Default settings for the category
 */
function getDefaults(category) {
  const settings = loadSettings();
  return settings.defaults[category] || {};
}

module.exports = {
  loadSettings,
  saveSettings,
  getPreset,
  getEnabledDevices,
  getDefaults,
  settingsExist,
  setSettingsPath,
  getSettingsPath,
  initSettings,
  resetSettings
};
