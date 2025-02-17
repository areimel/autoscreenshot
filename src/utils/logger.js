const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class Logger {
  constructor(options = {}) {
    this.logFile = options.logFile || path.join(process.cwd(), 'test-output.log');
    this.shouldConsole = options.console !== false;
    this.timestamp = options.timestamp !== false;
    this.maxLogFiles = options.maxLogFiles || 20;

    // Initialize test tracking
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };

    // Ensure the directory exists
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Perform log rotation if needed
    this._rotateLogFiles(logDir);

    // Create or clear the log file
    fs.writeFileSync(this.logFile, '');
  }

  _rotateLogFiles(logDir) {
    try {
      // Get all log files in the directory
      const files = fs.readdirSync(logDir)
        .filter(file => file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(logDir, file),
          time: fs.statSync(path.join(logDir, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // Sort by modification time, newest first

      // If we have more files than the maximum allowed, remove the oldest ones
      if (files.length >= this.maxLogFiles) {
        const filesToRemove = files.slice(this.maxLogFiles - 1);
        filesToRemove.forEach(file => {
          try {
            fs.unlinkSync(file.path);
            if (this.shouldConsole) {
              console.log(chalk.gray(`Removed old log file: ${file.name}`));
            }
          } catch (err) {
            console.error(chalk.red(`Failed to remove old log file ${file.name}: ${err.message}`));
          }
        });
      }
    } catch (err) {
      console.error(chalk.red(`Error during log rotation: ${err.message}`));
    }
  }

  _getTimestamp() {
    return this.timestamp ? `[${new Date().toISOString()}] ` : '';
  }

  _writeToFile(message) {
    // Strip ANSI color codes for file output
    const cleanMessage = message.replace(/\x1b\[[0-9;]*m/g, '');
    fs.appendFileSync(this.logFile, this._getTimestamp() + cleanMessage + '\n');
  }

  _writeSeparator(char = '-', length = 80) {
    const separator = char.repeat(length);
    this.log(separator);
  }

  log(message) {
    if (this.shouldConsole) {
      process.stdout.write(message + '\n');
    }
    this._writeToFile(message);
  }

  info(message) {
    const formatted = chalk.blue(message);
    this.log(formatted);
  }

  success(message) {
    const formatted = chalk.green(message);
    this.log(formatted);
  }

  error(message) {
    const formatted = chalk.red(message);
    this.log(formatted);
  }

  warning(message) {
    const formatted = chalk.yellow(message);
    this.log(formatted);
  }

  test(name, passed, message = '') {
    // Track test result
    this.testResults.total++;
    if (passed) {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
    }
    this.testResults.tests.push({ name, passed, message });

    const status = passed ? '✓ PASSED' : '✗ FAILED';
    const statusFormatted = passed ? chalk.green(status) : chalk.red(status);
    this.log(`${statusFormatted} ${name}`);
    if (message) {
      this.log(`  ${message}`);
    }
  }

  debug(message) {
    const formatted = chalk.gray(`Debug: ${message}`);
    this.log(formatted);
  }

  writeSummary() {
    const duration = process.hrtime.bigint() - this.startTime;
    const durationMs = Number(duration) / 1_000_000;

    this._writeSeparator('=');
    this.log('\nTest Summary:');
    this._writeSeparator('-');

    // Overall statistics
    this.log(`Total Tests: ${this.testResults.total}`);
    this.log(`Passed: ${chalk.green(this.testResults.passed)}`);
    this.log(`Failed: ${chalk.red(this.testResults.failed)}`);
    this.log(`Duration: ${durationMs.toFixed(2)}ms`);

    // Detailed results
    if (this.testResults.failed > 0) {
      this._writeSeparator('-');
      this.log('\nFailed Tests:');
      this.testResults.tests
        .filter(test => !test.passed)
        .forEach(test => {
          this.log(`${chalk.red('✗')} ${test.name}`);
          if (test.message) {
            this.log(`  ${test.message}`);
          }
        });
    }

    this._writeSeparator('=');

    // Final status
    if (this.testResults.failed === 0) {
      this.success('\nAll tests passed successfully! 🎉\n');
    } else {
      this.error(`\n${this.testResults.failed} test(s) failed! ❌\n`);
    }
  }

  startTestSuite() {
    this.startTime = process.hrtime.bigint();
  }
}

module.exports = Logger;
