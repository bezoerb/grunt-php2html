/*
 * Grunt-php2html
 * https://github.com/bzoerb/grunt-php2html
 *
 * Copyright (c) 2013 Ben Zörb
 * Licensed under the MIT license.
 */
'use strict';

module.exports = function (grunt) {
	const _ = require('lodash');
	const shjs = require('shelljs');
	const path = require('path');
	const php2html = require('php2html');
	const HTMLHint = require('htmlhint').HTMLHint;
	const compiled = [];

	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks
	grunt.registerMultiTask('php2html', 'Generate HTML from PHP', function () {
		const cb = this.async();

		let targetDirectory;

		const options = this.options({
			process: false,
			htmlhint: undefined,
			docroot: undefined,
			haltOnError: true
		});

		// Nothing to do
		if (this.files.length === 0) {
			grunt.log.warn('Destination not written because no source files were provided.');
			return;
		}

		// Read config file for htmlhint if available
		if (options.htmlhintrc) {
			if (options.htmlhintrc === true) {
				options.htmlhintrc = findFile('.htmlhintrc', process.cwd());
			}

			try {
				const rc = grunt.file.readJSON(options.htmlhintrc);
				grunt.util._.defaults(options.htmlhint, rc);
			} catch (error) {
				grunt.log.error('.htmlhintrc not found!');
			}

			delete options.htmlhintrc;
		}

		// Set to undefined to use default params when value is true
		if (options.htmlhint === true) {
			options.htmlhint = undefined;
		}

		// Set empty object to false to keep backwards compatibility
		if (_.isObject(options.htmlhint) && Object.keys(options.htmlhint).length === 0) {
			options.htmlhint = false;
		}

		/// / $_GET data
		// if (typeof options.getData !== 'undefined') {
		//    queryString = qs.stringify(options.getData);
		// }

		// Loop files array
		grunt.util.async.forEachSeries(this.files, (f, nextFileObj) => {
			// Try to get docroot
			// first: docroot from options
			// third: use process cwd
			let docroot = path.normalize(options.docroot || f.orig.cwd || process.cwd());

			// Check docroot
			if (!grunt.file.exists(docroot)) {
				grunt.log.warn('Docroot "' + docroot + '" does not exist');
				return nextFileObj();
			}

			// Absolutize docroot
			if (!grunt.file.isPathAbsolute(docroot)) {
				docroot = path.normalize(path.join(process.cwd(), docroot));
			}

			// Remove trailing slash
			docroot = docroot.replace(/\/$/, '');

			// Warn on and remove invalid source files (if null was set).
			let files = f.src.filter(filepath => {
				if (!grunt.file.exists(filepath) && !options.router) {
					grunt.log.warn('Source file "' + filepath + '" not found.');
					return false;
				}

				return true;

				// Add routes
			});

			if (options.router) {
				files = files.concat(f.orig.src.filter(filepath => {
					return !/(^!)|(\*)/.test(filepath);
				}));
			}

			// Check files
			if (files.length === 0) {
				grunt.log.warn('Destination not written because no source files were found.');

				// No src files, goto next target. Warn would have been issued above.
				return nextFileObj();
			}

			// Check if dest is directory
			if (detectDestType(f.dest) === 'directory') {
				targetDirectory = path.normalize(f.dest);
			} else {
				targetDirectory = path.dirname(f.dest);
			}

			// Make shure dest directory exists
			if (!grunt.file.isDir(targetDirectory)) {
				grunt.file.mkdir(targetDirectory);
			}

			grunt.util.async.concatSeries(_.uniq(files), (file, next) => {
				// Compute target filename
				let target;
				if (detectDestType(f.dest) === 'directory') {
					target = path.join(targetDirectory, path.basename(file, '.php') + '.html');
				} else {
					target = path.join(targetDirectory, path.basename(f.dest));
				}

				grunt.log.debug('----------------------------------');
				grunt.log.debug('docroot: ', docroot);
				grunt.log.debug('target', target);
				grunt.log.debug('----------------------------------');
				grunt.log.write('Processing ' + file + '...');

				php2html(file, _.assign(options, {baseDir: docroot}), (error, response) => {
					// Does the last part of the job
					const finish = function (target, response, cb) {
						let messages = [];

						const empty = typeof response === 'undefined' || response === '';

						// Lint generated html and check if response is  empty
						if (options.htmlhint !== false) {
							messages = HTMLHint.verify(response || '', options.htmlhint);
						}

						// Move on to the next file if everything went right
						if (!error && messages.length === 0 && !empty) {
							grunt.file.write(target, response);
							grunt.log.ok();
							grunt.log.debug(target + ' written');
							compiled.push(target);

							// There was an error, show messages to the user if applicable and move on
						} else {
							grunt.log.error();

							if (empty) {
								grunt.log.warn('Resulting HTML is empty');
							}

							if (!options.haltOnError) {
								try {
									grunt.file.write(target, response);
								} catch (error) {
									grunt.log.error(error);
								}
							}

							// Output messages
							messages.forEach(message => {
								grunt.log.writeln('['.red + ('L' + message.line).yellow + ':'.red + ('C' + message.col).yellow + ']'.red + ' ' + message.message.yellow);
							});
						}

						cb();
					};

					// ProcessOutput function
					if (options.process && typeof options.process === 'function') {
						options.process(response, function callback(modified) {
							finish(target, modified, next);
						});
					} else {
						finish(target, response, next);
					}
				});
			}, () => {
				grunt.log.debug('done');
				nextFileObj();
			});
		}, cb);
	});

	/**
     * Get type of destination path
     * @param {string} dest
     * @returns {string} directory|file
     */
	const detectDestType = function (dest) {
		if (grunt.util._.endsWith(dest, '/') || grunt.util._.endsWith(dest, '\\')) {
			return 'directory';
		}

		return 'file';
	};

	// Storage for memoized results from find file
	// Should prevent lots of directory traversal &
	// lookups when liniting an entire project
	const findFileResults = {};

	/**
     * Searches for a file with a specified name starting with
     * 'dir' and going all the way up either until it finds the file
     * or hits the root.
     *
     * copied from
     * https://github.com/jshint/jshint/blob/master/src/cli.js
     *
     * @param {string} name filename to search for (e.g. .jshintrc)
     * @param {string} dir  directory to start search from (default:
     *                      current working directory)
     *
     * @returns {string} normalized filename
     */
	function findFile(name, dir) {
		dir = dir || process.cwd();

		const filename = path.normalize(path.join(dir, name));
		if (findFileResults[filename] !== undefined) {
			return findFileResults[filename];
		}

		const parent = path.resolve(dir, '../');

		if (shjs.test('-e', filename)) {
			findFileResults[filename] = filename;
			return filename;
		}

		if (dir === parent) {
			findFileResults[filename] = null;
			return null;
		}

		return findFile(name, parent);
	}
};
