const assert = require('assert');
const path = require('path');
const fs = require('fs');
const {
  loadSettings,
  saveSettings,
  setSettingsPath,
  getSettingsPath,
  resetSettings
} = require('../utils/settings');

// Test helper to create temporary test directory
function createTempTestDir() {
  const tempDir = path.join(process.cwd(), 'test-temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  return tempDir;
}

// Test helper to clean up temporary test directory
function cleanupTempTestDir() {
  const tempDir = path.join(process.cwd(), 'test-temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

describe('Settings Validation Tests', () => {
  let tempDir;

  before(() => {
    tempDir = createTempTestDir();
  });

  after(() => {
    cleanupTempTestDir();
  });

  beforeEach(async () => {
    // Reset settings before each test
    await resetSettings();
  });

  describe('Settings Path Validation', () => {
    it('should reject invalid file extensions', async () => {
      const invalidPath = path.join(tempDir, 'settings.txt');
      try {
        setSettingsPath(invalidPath);
        assert.fail('Should have thrown an error for invalid extension');
      } catch (error) {
        assert.ok(error.message.includes('Invalid settings file path'));
      }
    });

    it('should accept valid JSON file paths', async () => {
      const validPath = path.join(tempDir, 'settings.json');
      try {
        setSettingsPath(validPath);
        assert.strictEqual(getSettingsPath(), validPath);
      } catch (error) {
        assert.fail(`Should not have thrown an error: ${error.message}`);
      }
    });
  });

  describe('Settings Content Validation', () => {
    it('should reject invalid settings object', async () => {
      try {
        await saveSettings({ invalid: 'settings' });
        assert.fail('Should have thrown an error for invalid settings');
      } catch (error) {
        assert.ok(error.message.includes('Invalid settings'));
      }
    });

    it('should validate device configurations', async () => {
      const settings = await loadSettings();
      const invalidSettings = JSON.parse(JSON.stringify(settings)); // Deep clone
      invalidSettings.devices.desktop.width = -1;

      try {
        await saveSettings(invalidSettings);
        assert.fail('Should have thrown an error for invalid device width');
      } catch (error) {
        assert.ok(error.message.includes('Invalid width for desktop'));
      }
    });

    it('should accept valid settings', async () => {
      try {
        const settings = await loadSettings();
        await saveSettings(settings);
        assert.ok(true, 'Settings were saved successfully');
      } catch (error) {
        assert.fail(`Should not have thrown an error: ${error.message}`);
      }
    });
  });
});
