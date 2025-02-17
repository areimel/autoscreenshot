# AutoScreenshot CLI Tool

A powerful command-line tool for capturing automated website screenshots across multiple device sizes. Perfect for developers, designers, and QA teams who need to document web pages across different viewport sizes.

[![NPM Version][npm-image]][npm-url]
[![License][license-image]][license-url]

## Features

- 📱 Multi-device screenshot capture (desktop, laptop, tablet, phone)
- 📜 Full-page and viewport-specific captures
- ⚡ Batch processing via JSON/CSV
- ⏱️ Configurable delay for dynamic content
- 🎨 Accessibility simulation mode
- ⚙️ Customizable settings and presets
- 🖼️ Multiple output formats (PNG, JPG)
- 🎯 Interactive CLI interface

## Installation

```bash
npm install -g autoscreenshot
```

On first run, the tool will guide you through initial setup and install required dependencies like Chromium.

## Quick Start

Take a screenshot of a website:
```bash
autoscreenshot https://example.com
```

The CLI will walk you through available options, or you can specify them directly:
```bash
autoscreenshot https://example.com --type full-page --device all --delay 1.5 --format png
```

## Usage

### Basic Commands

- Basic screenshot: `autoscreenshot <url>`
- Batch mode: `autoscreenshot batch`
- Help: `autoscreenshot --help`

### Screenshot Options

- **Screenshot Type**
  - Full page (captures entire scrollable content)
  - Initial viewport (captures "above the fold" content)

- **Device Sizes**
  - Desktop
  - Laptop
  - Tablet
  - Phone
  - All devices (captures all sizes)
  - Custom sizes (configurable via settings)

- **Additional Options**
  - Delay: Set loading delay in seconds
  - Format: PNG or JPG
  - File destination: Custom save location

### Batch Mode

Process multiple URLs from a JSON or CSV file:
```bash
autoscreenshot batch --input urls.json
```

Example JSON format:
```json
{
  "settings": {
    "type": "full-page",
    "device": "all",
    "delay": 1.5
  },
  "urls": [
    "https://example1.com",
    "https://example2.com"
  ]
}
```

### Accessibility Mode

Simulate various visual conditions:
```bash
autoscreenshot https://example.com --accessibility colorblind
```

## Configuration

The tool uses a `settings.json` file for customization. Default location: `~/autoscreenshot/settings.json`

Example configuration:
```json
{
  "devices": {
    "desktop": "1920x1080",
    "laptop": "1366x768",
    "tablet": "768x1024",
    "phone": "375x667",
    "largeDisplay": "2400x1600"
  },
  "defaults": {
    "format": "jpg",
    "delay": 1,
    "saveLocation": "~/Documents/Screenshots"
  }
}
```

## Requirements

- Node.js 14.0 or higher
- Internet connection (for initial Chromium download)
- Sufficient disk space for screenshots

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📚 [Documentation](docs/README.md)
- 🐛 [Issue Tracker](https://github.com/yourusername/autoscreenshot/issues)
- 💬 [Discussions](https://github.com/yourusername/autoscreenshot/discussions)

[npm-image]: https://img.shields.io/npm/v/autoscreenshot.svg
[npm-url]: https://npmjs.org/package/autoscreenshot
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg
[license-url]: LICENSE
