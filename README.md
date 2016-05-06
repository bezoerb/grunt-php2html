# grunt-php2html [![Build Status](https://travis-ci.org/bezoerb/grunt-php2html.svg?branch=master)](https://travis-ci.org/bezoerb/grunt-php2html)

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

To make this work you need the `php-cgi` binaray in your PATH.

### Installing php-cgi

##### OSX

The `php-cgi` binary can be installed via Homebrew by tapping the
[homebrew-php](https://github.com/josegonzalez/homebrew-php) repository:

```shell
brew tap homebrew/dupes
brew tap homebrew/versions
brew tap homebrew/homebrew-php
brew install php56
```

##### Windows

The `php-cgi` binary can be installed via [XAMPP](http://www.apachefriends.org/de/xampp-windows.html). 
Here is how you can add the binary to your PATH: [Link](https://www.monosnap.com/image/psLZ5fpwuSsvJJeZPdklEjxMr)

##### Ubuntu

```shell
sudo apt-get install php5-cgi
```

## The "php2html" task

### Overview
Use this grunt plugin to compile php files to static html.
In your project's Gruntfile, add a section named `php2html` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  php2html: {
    options: {
      // Task-specific options go here.  
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
	  },
	  htmlhint: {},
	  htmlhintrc: .htmlhintrc,
	  docroot: <mydocroot relative to Gruntfile.js>
      getData: {'key': 'value'}

#### options.router
Type: `String`
Default value: `undefined`

Use a router script.

#### options.processLinks
Type: `Boolean`
Default value: `true`

Convert links pointing to `.php` pages to the `.html` equivalent.

#### options.process
Type: `Function`
Params: `String` Response text, `Function` Callback function
Default value: `undefined`

Implement your own response parser and return the processed response back to the task

#### options.htmlhint
Type: `Object`

Pass a list of [rules](https://github.com/yaniswang/HTMLHint/wiki/Rules)  for linting the compiled HTML.

If rules is undefined, it will use default ruleset:
```
{
    'tagname-lowercase': true,
    'attr-lowercase': true,
    'attr-value-double-quotes': true,
    'doctype-first': true,
    'tag-pair': true,
    'spec-char-escape': true,
    'id-unique': true,
    'src-not-empty': true
}
```

#### options.htmlhintrc
Type: `String`
Default value: `null`

If this filename is specified, options and globals defined therein will be used. Task and target options override the options within the `htmlhintrc` file. The `htmlhintrc` file must be valid JSON and looks something like this:

```json
{
  "tag-pair": true,
}
```

#### options.docroot
Type: `String`
Default value: process.cwd()

Specify a docroot for the php Server. All php files will be served relative to this directory.

#### options.port
Type: `Int`
Default value: `8888`

Specify a port for the php Server.

#### options.getData
Type: `Object`
Default value: `{}`

Pass data to php file using $_GET.

#### options.haltOnError
Type: `Boolean`
Default value: `true`

Set to `false` to write dest html files on error. Usefull for debugging.

##### requestHost
Type: `String`
Default value: `undefined`

Use this option to tweak the request host passed to the `.php` script as `SERVER_NAME` and `SERVER_PORT`.   



### Usage Examples

```js
grunt.initConfig({
  php2html: {
    default: {
	  options: {
	    // tweak $_SERVER['SERVER_NAME'] & $_SERVER['SERVER_HOST'] 
	    requestHost: 'mydomain.com:8080',
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


## Release History
 * 2014-25-04   v0.1.10  Added getData option to pass variables to php script
 * 2013-11-09   v0.1.7   Added docroot option
 * 2013-11-07   v0.1.6   Fixed some path issues on windows
 * 2013-11-04   v0.1.5   Added HTMLHint support
 * 2013-08-09   v0.1.4   First release
 
