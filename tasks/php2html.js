/*
 * grunt-php2html
 * https://github.com/bzoerb/grunt-php2html
 *
 * Copyright (c) 2013 Ben Zörb
 * Licensed under the MIT license.
 */
'use strict';

var path = require('path'),
	_ = require('lodash');

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

		var options = this.options({
			processLinks: true,
			process: false
		});


		if (this.files.length < 1) {
			grunt.log.warn('Destination not written because no source files were provided.');
		}




		grunt.util.async.forEachSeries(this.files, function (f, nextFileObj) {


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
				grunt.log.debug(f.src + ' -> ' + f.dest);
			}

			// Make sure grunt creates the destination folders
			if (grunt.file.isDir(f.dest) || grunt.util._.endsWith(f.dest, '/')) {
				grunt.log.debug(f.dest + 'is directory');
				grunt.file.mkdir(f.dest);
			}

			var compiled = [];
			grunt.util.async.concatSeries(files, function (file, next) {
				var destFile = f.dest;

				// check if dest is directory
				if (grunt.file.isDir(destFile)  || grunt.util._.endsWith(f.dest, '/')) {
					destFile = f.dest + '/' + path.basename(file,'.php') + '.html';
					grunt.log.debug(file + ' -> ' + destFile);
				}

				// start server
				var docroot = path.dirname(file);
				grunt.log.debug('virtual docroot: ' + docroot);
				middleware = gateway(docroot, {
					'.php': 'php-cgi'
				});

				app = http.createServer(function (req, res) {
					middleware(req, res, function (err) {
						grunt.log.warn(err);
						res.writeHead(204, err);
						res.end();
					});
				});



				// Make sure grunt creates the destination folders
				grunt.file.write(destFile, '');

				grunt.log.debug(file);

				compilePhp(path.basename(file), function (response, err) {

					grunt.log.debug('processLinks: ' + options.processLinks);
					// replace
					if (options.processLinks) {
						_.forEach(response.match(/href=['"]([^'"]+\.php(?:\?[^'"]*)?)['"]/gm),function(link){
							if (link.match(/:\/\//)) {
								return;
							}

							var hlink = link.replace(/(\w)\.php([^\w])/g,'$1.html$2');
							response = response.replace(link,hlink);
						});
					//	response.match(/href=['"]([^'"]+)['"]/gm)
					//	response = response.replace(/(\w)\.php([^\w])/g,'$1.html$2');
					}

					// processOutput function
					if (options.process && typeof options.process === 'function') {
						options.process(response,function callback(modified){
							grunt.file.write(destFile,modified);
						});
					} else {
						grunt.file.write(destFile,response);
					}


					if (!err) {
						compiled.push(file);
						next();
					} else {
						nextFileObj(err);
					}
				});
			}, function () {
				grunt.log.debug('done');
				nextFileObj();
			});

		}, cb);
	});

	var compilePhp = function (file, callback) {

		app.listen(8888);
		request('http://localhost:8888/' + file, function (error, response, body) {
			app.close();
			callback(body,error);
		}).end();
	};


};
