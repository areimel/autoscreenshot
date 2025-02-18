const ERROR_TYPES = {
  VALIDATION: 'validation',
  NETWORK: 'network',
  FILE_SYSTEM: 'filesystem',
  BROWSER: 'browser',
  SETTINGS: 'settings',
  UNKNOWN: 'unknown'
};

const ERROR_MESSAGES = {
  // URL Validation
  INVALID_URL: (url) => ({
    type: ERROR_TYPES.VALIDATION,
    message: `Invalid URL: "${url}"\nPlease provide a valid URL starting with http:// or https://`
  }),

  // Screenshot Type Validation
  INVALID_SCREENSHOT_TYPE: (type) => ({
    type: ERROR_TYPES.VALIDATION,
    message: `Invalid screenshot type: "${type}"\nAllowed types are: full-page, viewport`
  }),

  // Device Size Validation
  INVALID_DEVICE_SIZE: (device) => ({
    type: ERROR_TYPES.VALIDATION,
    message: `Invalid device size: "${device}"\nAllowed devices are: desktop, laptop, tablet, phone, all`
  }),

  // Delay Validation
  INVALID_DELAY: (delay) => ({
    type: ERROR_TYPES.VALIDATION,
    message: `Invalid delay time: "${delay}"\nDelay must be a positive number (in seconds)`
  }),

  // Format Validation
  INVALID_FORMAT: (format) => ({
    type: ERROR_TYPES.VALIDATION,
    message: `Invalid file format: "${format}"\nAllowed formats are: png, jpg`
  }),

  // Browser Errors
  BROWSER_LAUNCH_FAILED: (error) => ({
    type: ERROR_TYPES.BROWSER,
    message: `Failed to launch browser: ${error}\nPlease check your system resources and try again`
  }),

  PAGE_LOAD_FAILED: (url, status, statusText) => ({
    type: ERROR_TYPES.NETWORK,
    message: `Failed to load page: ${url}\nStatus: ${status} ${statusText}\nPlease check the URL and your internet connection`
  }),

  // File System Errors
  DIRECTORY_CREATE_FAILED: (path, error) => ({
    type: ERROR_TYPES.FILE_SYSTEM,
    message: `Failed to create directory: ${path}\nError: ${error}\nPlease check file permissions and disk space`
  }),

  SAVE_SCREENSHOT_FAILED: (path, error) => ({
    type: ERROR_TYPES.FILE_SYSTEM,
    message: `Failed to save screenshot to: ${path}\nError: ${error}\nPlease check file permissions and disk space`
  }),

  // Settings Errors
  SETTINGS_LOAD_FAILED: (error) => ({
    type: ERROR_TYPES.SETTINGS,
    message: `Failed to load settings: ${error}\nFalling back to default settings`
  }),

  SETTINGS_SAVE_FAILED: (error) => ({
    type: ERROR_TYPES.SETTINGS,
    message: `Failed to save settings: ${error}\nPlease check file permissions and disk space`
  }),

  PRESET_NOT_FOUND: (preset) => ({
    type: ERROR_TYPES.SETTINGS,
    message: `Preset not found: "${preset}"\nPlease check your settings file for available presets`
  })
};

const WARNING_MESSAGES = {
  LONG_DELAY: (delay) => ({
    message: `Warning: Long delay specified (${delay} seconds). The process might take a while.`
  }),

  HIGH_MEMORY_USAGE: {
    message: 'Warning: High memory usage detected. Consider capturing screenshots one at a time.'
  },

  LARGE_VIEWPORT: (device, width, height) => ({
    message: `Warning: Large viewport size for ${device} (${width}x${height}). This might affect performance.`
  }),

  FEATURE_NOT_IMPLEMENTED: (feature) => ({
    message: `${feature} is not implemented yet. Stay tuned for future updates!`
  })
};

module.exports = {
  ERROR_TYPES,
  ERROR_MESSAGES,
  WARNING_MESSAGES
};
