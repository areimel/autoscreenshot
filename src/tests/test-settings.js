const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const {
  loadSettings,
  saveSettings,
  getPreset,
  getEnabledDevices,
  getDefaults,
  settingsExist
} = require('../utils/settings');
const Logger = require('../utils/logger');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Initialize logger with path in tests/logs directory
const logger = new Logger({
  logFile: path.join(logsDir, `settings-${new Date().toISOString().replace(/[:.]/g, '-')}.log`),
  console: true,
  timestamp: true
});

// Start timing the test suite
logger.startTestSuite();

logger.info('Starting settings tests...');
logger.debug('Initializing test environment');

// Helper function to log test results
function logTest(name, passed, message = '') {
  logger.debug(`Running test: ${name}`);
  logger.test(name, passed, message);
}

// Test settings file existence
function testSettingsExistence() {
  logger.debug('Testing settings existence');
  const exists = settingsExist();
  logTest('Settings file existence', exists,
    exists ? 'Settings file found' : 'Settings file not found (will be created)');
  return exists;
}

// Test loading settings
function testLoadSettings() {
  logger.debug('Testing settings loading');
  try {
    logger.debug('About to call loadSettings()');
    const settings = loadSettings();
    logger.debug(`Settings loaded: ${settings ? 'yes' : 'no'}`);
    logger.debug('Settings object: ' + JSON.stringify(settings, null, 2));

    if (!settings) {
      logger.debug('Settings is null or undefined');
      logTest('Load settings', false, 'Settings object is null or undefined');
      return null;
    }

    const requiredKeys = ['version', 'defaults', 'devices', 'presets'];
    logger.debug('Checking required keys: ' + JSON.stringify(requiredKeys));

    const hasRequiredKeys = requiredKeys.every(key => {
      const hasKey = key in settings;
      logger.debug(`Checking key "${key}": ${hasKey}`);
      return hasKey;
    });

    logger.debug(`Has required keys: ${hasRequiredKeys}`);
    logTest('Load settings', hasRequiredKeys,
      hasRequiredKeys ? 'All required keys present' : 'Missing required keys');
    return settings;
  } catch (error) {
    logger.error(`Error in testLoadSettings: ${error}`);
    logger.debug(`Error stack: ${error.stack}`);
    logTest('Load settings', false, `Error: ${error.message}`);
    return null;
  }
}

// Test getting presets
function testPresets() {
  try {
    const mobilePreset = getPreset('mobile');
    const fullpagePreset = getPreset('fullpage');
    const nonexistentPreset = getPreset('nonexistent');

    const mobileValid = mobilePreset && mobilePreset.device === 'phone';
    const fullpageValid = fullpagePreset && fullpagePreset.type === 'full-page';
    const nonexistentValid = nonexistentPreset === null;

    logTest('Get mobile preset', mobileValid,
      mobileValid ? 'Mobile preset retrieved correctly' : 'Mobile preset invalid');
    logTest('Get fullpage preset', fullpageValid,
      fullpageValid ? 'Fullpage preset retrieved correctly' : 'Fullpage preset invalid');
    logTest('Handle nonexistent preset', nonexistentValid,
      nonexistentValid ? 'Nonexistent preset handled correctly' : 'Nonexistent preset not handled correctly');
  } catch (error) {
    logger.error(`Error in testPresets: ${error}`);
    logTest('Preset tests', false, `Error: ${error.message}`);
  }
}

// Test getting enabled devices
function testEnabledDevices() {
  try {
    const devices = getEnabledDevices();
    const hasStandardDevices = ['desktop', 'laptop', 'tablet', 'phone'].every(device => device in devices);
    const customDeviceHandled = !('largeDisplay' in devices);

    logTest('Get enabled devices', hasStandardDevices,
      hasStandardDevices ? 'All standard devices present' : 'Missing standard devices');
    logTest('Handle disabled custom devices', customDeviceHandled,
      customDeviceHandled ? 'Disabled custom device handled correctly' : 'Disabled custom device incorrectly included');
  } catch (error) {
    logger.error(`Error in testEnabledDevices: ${error}`);
    logTest('Device tests', false, `Error: ${error.message}`);
  }
}

// Test getting defaults
function testDefaults() {
  try {
    const formatDefaults = getDefaults('format');
    const delayDefaults = getDefaults('delay');
    const fileDestDefaults = getDefaults('fileDestination');

    const formatValid = formatDefaults && 'type' in formatDefaults;
    const delayValid = delayDefaults && 'seconds' in delayDefaults;
    const fileDestValid = fileDestDefaults && 'path' in fileDestDefaults;

    logTest('Get format defaults', formatValid,
      formatValid ? 'Format defaults retrieved correctly' : 'Format defaults invalid');
    logTest('Get delay defaults', delayValid,
      delayValid ? 'Delay defaults retrieved correctly' : 'Delay defaults invalid');
    logTest('Get file destination defaults', fileDestValid,
      fileDestValid ? 'File destination defaults retrieved correctly' : 'File destination defaults invalid');
  } catch (error) {
    logger.error(`Error in testDefaults: ${error}`);
    logTest('Defaults tests', false, `Error: ${error.message}`);
  }
}

// Test saving modified settings
function testSaveSettings() {
  try {
    const settings = loadSettings();
    settings.interface.verboseLogging = !settings.interface.verboseLogging;
    saveSettings(settings);

    const newSettings = loadSettings();
    const saveSuccessful = newSettings.interface.verboseLogging === settings.interface.verboseLogging;

    logTest('Save and reload settings', saveSuccessful,
      saveSuccessful ? 'Settings saved and reloaded successfully' : 'Settings save/reload failed');
  } catch (error) {
    logger.error(`Error in testSaveSettings: ${error}`);
    logTest('Save settings test', false, `Error: ${error.message}`);
  }
}

// Run all tests
logger.info('\nRunning test suite...\n');

try {
  logger.debug('Starting test sequence');
  const exists = testSettingsExistence();
  logger.debug(`Settings exist: ${exists}`);

  if (!exists) {
    logger.info('\nCreating new settings file...');
  }

  logger.debug('Loading settings');
  const settings = testLoadSettings();
  logger.debug(`Settings loaded: ${settings ? 'yes' : 'no'}`);

  if (settings) {
    logger.info('\nTesting presets...');
    testPresets();

    logger.info('\nTesting device configurations...');
    testEnabledDevices();

    logger.info('\nTesting defaults...');
    testDefaults();

    logger.info('\nTesting settings modification...');
    testSaveSettings();
  }

  // Write test summary
  logger.writeSummary();
} catch (error) {
  logger.error('Fatal error in test execution:');
  logger.error(error.stack || error.message);
  // Write summary even if there's an error
  logger.writeSummary();
  process.exit(1);
}
