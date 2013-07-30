/*
 * grunt-php2html
 * https://github.com/bzoerb/grunt-php2html
 *
 * Copyright (c) 2013 Ben Zörb
 * Licensed under the MIT license.
 */
'use strict';

var path = require('path');

module.exports = function (grunt) {

	var path = require('path'),
		http = require('http'),
		request = require('request'),
		gateway = require('gateway'),
		app,middleware;


	// Please see the Grunt documentation for more information regarding task
	// creation: http://gruntjs.com/creating-tasks

	grunt.registerMultiTask('php2html', 'Generate HTML from PHP', function () {

		var cb = this.async();

		if (this.files.length < 1) {
			grunt.log.warn('Destination not written because no source files were provided.');
		}

		var src = this.files[0].src;
		grunt.log.debug('virtual docroot: ' + path.dirname(src));
		middleware = gateway(path.dirname(src), {
			'.php': 'php-cgi'
		});

		app = http.createServer(function (req, res) {
			middleware(req, res, function (err) {
				grunt.log.warn(err);
				res.writeHead(204, err);
				res.end();
			});
		}).listen(8888);


		grunt.util.async.forEachSeries(this.files, function (f, nextFileObj) {
			var destFile = f.dest;

			var files = f.src.filter(function (filepath) {
				// Warn on and remove invalid source files (if nonull was set).
				if (!grunt.file.exists(filepath)) {
					grunt.log.warn('Source file "' + filepath + '" not found.');
					return false;
				} else {
					return true;
				}
			});

			if (files.length === 0) {
				if (f.src.length < 1) {
					grunt.log.warn('Destination not written because no source files were found.');
				}

				// No src files, goto next target. Warn would have been issued above.
				return nextFileObj();
			} else {
				grunt.log.debug(f.src + ' -> ' + destFile);
			}

			// Make sure grunt creates the destination folders
			grunt.file.write(f.dest, '');

			var compiled = [];
			grunt.util.async.concatSeries(files, function (file, next) {

				compilePhp(path.basename(file), function (response, err) {

					grunt.file.write(f.dest,response);

					if (!err) {

						compiled.push(f.src);
						next();
					} else {
						nextFileObj(err);
					}
				});
			}, function () {
				grunt.log.debug('done');
				app.close();
				nextFileObj();
			});

		}, cb);
	});

	var compilePhp = function (file, callback) {
		request('http://localhost:8888/' + file, function (error, response, body) {
			callback(body,error);
		}).end();
	};


};
