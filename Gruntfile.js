/*
 * grunt-php2html
 * https://github.com/bzoerb/grunt-php2html
 *
 * Copyright (c) 2013 Ben Zörb
 * Licensed under the MIT license.
 */
'use strict';

module.exports = function (grunt) {

	// show elapsed time at the end
	require('time-grunt')(grunt);
	// load all grunt tasks
	require('load-grunt-tasks')(grunt);

	// Make an empty dir for testing as git doesn't track empty folders.
	//grunt.file.mkdir('test/fixtures/empty_folder');
	//grunt.file.mkdir('test/expected/copy_test_mix/empty_folder');

	// Project configuration.
	grunt.initConfig({
		jshint: {
			all: [
				'Gruntfile.js',
				'tasks/**/*.js',
				'<%= nodeunit.tests %>'
			],
			options: {
				jshintrc: '.jshintrc'
			}
		},

		// Before generating any new files, remove any previously-created files.
		clean: {
			tests: ['tmp']
		},

		// Configuration to be run (and then tested).
		php2html: {
			default: {
				options: {
					// relative links should be renamed from .php to .html
					processLinks: true,
					htmlhint: {
						'doctype-first': false
					}
				},
				files: [
					{expand: true, cwd: 'test/', src: ['**/*.php'], dest: 'tmp/default', ext: '.html' }
				]
			},

			'dest-as-target': {
				options: {
					processLinks: false,
					htmlhint: {
						'doctype-first': false
					}
				},
				files: {
					'tmp/dest-as-target/': ['test/some-other-fixtures/info.php','test/fixtures/index.php']
				}
			},

			'processTest': {
				options: {
					processLinks: false,
					htmlhint: {
						'doctype-first': false
					},
					process: function(response,callback) {
						callback(':-)');
					}
				},
				files: {
					'tmp/processTest/': ['test/fixtures/index.php']
				}
			}
		},

		// Unit tests.
		nodeunit: {
			tests: ['test/*_test.js']
		}

	});

	// Actually load this plugin's task(s).
	grunt.loadTasks('tasks');


	// Whenever the "test" task is run, first clean the "tmp" dir, then run this
	// plugin's task(s), then test the result.
	grunt.registerTask('test', ['clean', 'php2html', 'nodeunit']);

	// By default, lint and run all tests.
	grunt.registerTask('default', ['jshint', 'test']);

};
