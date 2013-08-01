# grunt-php2html [![Build Status](https://travis-ci.org/bezoerb/grunt-php2html.png?branch=master)](https://travis-ci.org/bezoerb/grunt-php2html) ![Dependencies](https://david-dm.org/bezoerb/grunt-php2html.png)

> Frontend HTML generation with PHP

## Getting Started
This plugin requires Grunt `~0.4.1` and `php-cgi`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-php2html --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-php2html');
```

### Installing php-cgi

The `php-cgi` binary can be installed via Homebrew by tapping the
[homebrew-php](https://github.com/josegonzalez/homebrew-php) repository:

```shell
brew tap homebrew/dupes
brew tap josegonzalez/homebrew-php
brew install php54
```

## The "php2html" task

### Overview
In your project's Gruntfile, add a section named `php2html` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  php2html: {
    options: {
      // Task-specific options go here.  
');
					}
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

### Options

// relative links should be renamed from .php to .html
	  processLinks: true,
	  // some function to process the output 
	  process: function(response,callback) {
	  	callback(':-)');
	  }


#### options.processLinks
Type: `Boolean`
Default value: `true`

Convert links pointing to `.php` pages to the `.html` equivalent.

#### options.process
Type: `Function`
Params: `String` Response text, `Function` Callback function
Default value: `undefined`

Implement your own response parser and return the processed respobnse back to the task

### Usage Examples

```js
grunt.initConfig({
  php2html: {
    default: {
	  options: {
		// relative links should be renamed from .php to .html
		processLinks: false,
		process: function(response,callback) {
		  // do some funy stuff with the reponse text
		  var parsedResponse = ...
		  // send it back to the task
		  callback(parsedResponse);
		}
	  },
	  files: [
		{expand: true, cwd: 'app/', src: ['*.php'], dest: 'build', ext: '.html' }
	  ]
	}
  },
})
```


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
