const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { isFirstRun, runSetup } = require('../utils/setup');
const { loadSettings, resetSettings, setSettingsPath } = require('../utils/settings');
const inquirer = require('inquirer');

// Mock inquirer prompt
const mockPrompt = {
  defaultFormat: 'jpg',
  jpgQuality: 85,
  outputPath: './screenshots',
  createTimestampFolders: true,
  defaultDelay: 2,
  enabledDevices: ['desktop', 'phone'],
  verboseLogging: true
};

// Store original prompt function
const originalPrompt = inquirer.prompt;

describe('Setup Tests', () => {
  let tempSettingsPath;

  before(() => {
    // Create temp directory for test settings
    const tempDir = path.join(process.cwd(), 'test-temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    tempSettingsPath = path.join(tempDir, 'settings.json');

    // Set settings path to temp directory
    setSettingsPath(tempSettingsPath);

    // Mock inquirer.prompt
    inquirer.prompt = async () => mockPrompt;
  });

  after(() => {
    // Clean up temp directory
    const tempDir = path.join(process.cwd(), 'test-temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    // Restore original prompt function
    inquirer.prompt = originalPrompt;
  });

  beforeEach(async () => {
    // Delete temp settings file if it exists
    if (fs.existsSync(tempSettingsPath)) {
      fs.unlinkSync(tempSettingsPath);
    }
  });

  describe('First Run Detection', () => {
    it('should detect first run when settings file does not exist', async () => {
      const isFirst = await isFirstRun();
      assert.strictEqual(isFirst, true, 'Should detect first run when settings file is missing');
    });

    it('should not detect first run when settings file exists', async () => {
      // Create settings file
      await resetSettings();

      const isFirst = await isFirstRun();
      assert.strictEqual(isFirst, false, 'Should not detect first run when settings file exists');
    });
  });

  describe('Setup Process', () => {
    it('should create settings file with user preferences', async () => {
      await runSetup();
      const settings = await loadSettings();

      // Verify format settings
      assert.strictEqual(settings.defaults.format.type, mockPrompt.defaultFormat);
      assert.strictEqual(settings.defaults.format.jpgQuality, mockPrompt.jpgQuality);

      // Verify file destination settings
      assert.strictEqual(settings.defaults.fileDestination.path, mockPrompt.outputPath);
      assert.strictEqual(settings.defaults.fileDestination.createTimestampFolders, mockPrompt.createTimestampFolders);

      // Verify delay settings
      assert.strictEqual(settings.defaults.delay.seconds, mockPrompt.defaultDelay);

      // Verify device settings
      Object.keys(settings.devices).forEach(device => {
        if (device !== 'custom') {
          const shouldBeEnabled = mockPrompt.enabledDevices.includes(device);
          assert.strictEqual(settings.devices[device].enabled, shouldBeEnabled,
            `Device ${device} should be ${shouldBeEnabled ? 'enabled' : 'disabled'}`);
        }
      });

      // Verify interface settings
      assert.strictEqual(settings.interface.verboseLogging, mockPrompt.verboseLogging);
    });

    it('should preserve existing settings structure', async () => {
      // Run setup with mock values
      await runSetup();
      const settings = await loadSettings();

      // Check that all required sections exist
      const requiredSections = ['version', 'defaults', 'devices', 'presets', 'interface', 'batch'];
      requiredSections.forEach(section => {
        assert.ok(settings[section], `Settings should contain ${section} section`);
      });

      // Check that device configurations are preserved
      const requiredDevices = ['desktop', 'laptop', 'tablet', 'phone'];
      requiredDevices.forEach(device => {
        assert.ok(settings.devices[device], `Settings should contain ${device} configuration`);
        assert.ok(typeof settings.devices[device].width === 'number', `${device} should have width`);
        assert.ok(typeof settings.devices[device].height === 'number', `${device} should have height`);
      });
    });

    it('should handle invalid input gracefully', async () => {
      // Temporarily modify mock to provide invalid input
      const invalidMock = { ...mockPrompt, jpgQuality: -1, defaultDelay: -1 };
      inquirer.prompt = async () => invalidMock;

      try {
        await runSetup();
        assert.fail('Should throw error for invalid input');
      } catch (error) {
        assert.ok(error.message.includes('Invalid settings'), 'Should throw appropriate error message');
      } finally {
        // Restore original mock
        inquirer.prompt = async () => mockPrompt;
      }
    });
  });
});
