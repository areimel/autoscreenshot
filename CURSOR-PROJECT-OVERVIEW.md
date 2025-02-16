# autoscreenshot - cli tool

**Project summary**: I want to build a CLI tool called 'autoscreenshot' that takes screenshots of web pages using a headless browser. I would also like to publish this tool as an npm package so that others can use it.

## Build Process

I want this CLI tool to be Node.js-based, and have it work seamlessly on Windows, Mac, and Linux. I want the tools to be built using Commander.js to provide a helpful, verbose interface for the tool that walks the user through the tool's options. I'd also like it to be built using the Chalk library to provide colors and styling to the interface. I want the tool to use the 'fs' and 'path' libraries to handle files and filesystem operations. Finally, the tool should use the Puppeteer library to handle the headless browser. If there are any other libraries I'll need to handle major features I request, please let me know.

I would also like the tool to use a `settings.json` file to control certain features like device size, file format, delay options, and other features that can be easily controlled and modified by simple string and number values. Users should also be able to set up their own custom preset arguments using this file, so they can set up preset options they frequently use.

I would also like for the tool to check for and ask to download include any required libraries it needs, such as Chromium, during its initial installation.

## Features 

- The CLI tool should accept a URL as an input parameter. Running the CLI tool should look like `autoscreenshot https://test.com`.
- When the user only inputs a URL, the tool should then walk the user through a brief set of options for their screenshot, but the user should also be able to skip options by including them as arguments in their initial command input. The options I want available are:
	- 'screenshot type': This should be multiple choice with the options 'full page' or 'initial viewport'.
		- The 'full page' option should take a screenshot of the entire length of the page that is seamlessly stitched together.
		- The 'initial viewport' option should take a screenshot of just what is shown within the viewport when the page load - typically referred to as "above the fold" in marketing.
	- 'device size': This should be a multiple choice option, allowing the user to select a preset size for the screenshot. The choices should be 'desktop', 'laptop', 'tablet', 'phone'. 
		- There should also be an 'all devices' option that takes a screenshot on every device size. 
		- This option should be configurable in the `settings.json` file, allowing the user to add additional sizes such as `largeDisplay: '2400px'`, or adjust and rename the default sizes.
	- 'delay': This option should let the user set a delay before the headless browser takes a screenshot, to account for the page and any external plugins to load. The user should have the option to either input a number in seconds, including a decimal point, such as `1.5`, or to use their default delay setting, which can be configured in the `settings.json` file. 
	- 'format': This option should let the user choose between .png and .jpg files. The default should be .jpg, to save on file size, but this should be able to be configured in the `settings.json` file.
		- There should also be an option in `settings.json` to skip over this option in the interface and always use the default option.
	- 'file destination': this option should control where the screenshot gets saved to. It should let the user choose between their default preferred location, the folder the user is currently in, or let them choose to provide a location.
		- This option should be configurable in the `settings.json` file, allowing the user to change the default file destination. It should also let them choose whether they want to skip this option in the interface and always use the default option. 

## File Handling

On first installation, the autoscreenshot tool should ask the user to provide a folder location for their default file destination. It should give the user instructions to make it a new folder that is somewhere easy to find, such as on their desktop. The `settings.json` file should be located in this folder, and the CLI tool should create it there upon initial installation. 

## Modes

The autoscreenshot CLI tool should have multiple modes to allow it to handle different use cases:
- Normal mode: this is the normal default mode as described by this outline so far - the CLI tool takes one or more screenshots of a webpage and briefly walks the user through the screenshot options.
- Batch mode: this mode should take a series of screenshots based on a json or csv file provided by the user. The user activates the batch mode option by typing `autoscreenshot batch`. The CLI interface then displays a brief description of what batch mode is, and asks the user for the location of the json or csv file containing the URLs they want to screenshot, and then walk them through the usual settings that will then be applied to the entire batch. 
	- For json files, an argument string can be set at the beginning of the file to handle the screenshot settings.
	- The tools should save the entire batch of screenshots to its own folder, named something like `autoscreenshot-batch-date-time`
- Accessibility mode: This mode should apply various color filters or blurring to simulate what users with visual differences or disabilities would see.

## Help

If no URL or alternate mode is provided, such as if the user just types in `autoscreenshot`, I want the CLI tool to display a helpful set of instructions that explains the different options, their corresponding arguments, the different modes, and the locations of the current default file destination folder and the `settings.json` file.