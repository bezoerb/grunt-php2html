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
		var HTMLHint  = require("htmlhint").HTMLHint;

		var options = this.options({
			processLinks: true,
			process: false,
			htmlhint: undefined
		});

		if (options.htmlhintrc) {
			var rc = grunt.file.readJSON(options.htmlhintrc);
			grunt.util._.defaults(options.htmlhint, rc);
			delete options.htmlhintrc;
		}

		// htmllint only checks for rulekey, so remove rule if set to false
		if (typeof options.htmlhint !== 'undefined') {
			for (var i in options.htmlhint) {
				if (!options.htmlhint[i]) {
					delete options.htmlhint[i];
				}
			}
		}

		if (this.files.length < 1) {
			grunt.log.warn('Destination not written because no source files were provided.');
		}





		grunt.util.async.forEachSeries(this.files, function (f, nextFileObj) {
			var dest = f.dest;

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
			if (!grunt.file.isDir(dest) && detectDestType(dest) === 'directory') {
				grunt.log.debug('Create directory ' + path.normalize(f.dest));
				grunt.file.mkdir(dest);
			}

			var compiled = [];
			grunt.util.async.concatSeries(files, function (file, next) {
				dest = f.dest;

				// check if dest is directory
				if (grunt.file.isDir(dest)  || detectDestType(dest) === 'directory') {
					dest = path.join(f.dest,path.basename(file,'.php') + '.html');
				}

				// start server
				var docroot = path.normalize(path.dirname(file));
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
				grunt.file.write(dest, '');

				grunt.log.write('Processing ' + path.basename(file)+'...');


				compilePhp(path.basename(file), function (response, err) {

					// replace
					if (options.processLinks) {
						_.forEach(response.match(/href=['"]([^'"]+\.php(?:\?[^'"]*)?)['"]/gm),function(link){
							if (link.match(/:\/\//)) {
								return;
							}
							var hlink = link.replace(/(\w)\.php([^\w])/g,'$1.html$2');
							response = response.replace(link,hlink);
						});
					}

					// processOutput function
					if (options.process && typeof options.process === 'function') {
						options.process(response,function callback(modified){
							grunt.file.write(dest,modified);
						});
					} else {
						grunt.file.write(dest,response);
					}

					var messages = HTMLHint.verify(response, options.htmlhint);

					if (!err && messages.length === 0) {
						grunt.log.ok();
						grunt.log.debug(dest + ' written');
						compiled.push(file);
						next();
					} else {
						grunt.log.error();

						messages.forEach(function( message ) {
							grunt.log.writeln( "[".red + ( "L" + message.line ).yellow + ":".red + ( "C" + message.col ).yellow + "]".red + ' ' + message.message.yellow );
							var evidence = message.evidence,
								col = message.col;
							if (col === 0) {
								evidence = '?'.inverse.red + evidence;
							} else if (col > evidence.length) {
								evidence = evidence + ' '.inverse.red;
							} else {
								evidence = evidence.slice(0, col - 1) + evidence[col - 1].inverse.red + evidence.slice(col);
							}
							grunt.log.writeln(evidence);
						});

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

	var detectDestType = function(dest) {
		if (grunt.util._.endsWith(dest, '/') || grunt.util._.endsWith(dest, '\\')) {
			return 'directory';
		} else {
			return 'file';
		}
	};



};
